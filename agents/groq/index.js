const { ChatGroq } = require('@langchain/groq');
const { RunnableSequence } = require('@langchain/core/runnables');
const {
    ChatPromptTemplate,
    MessagesPlaceholder,
} = require('@langchain/core/prompts');

const { BufferMemory } = require('langchain/memory');
const { RedisChatMessageHistory } = require('@langchain/redis');

const dotenv = require('dotenv');
dotenv.config();

// Cria o modelo da Groq
const generateModel = (detalhes = {}) => {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: detalhes?.model || 'llama-3.1-8b-instant',
        temperature: detalhes?.temperature || 0.2,
        maxTokens: detalhes?.maxTokens || 1000,
        topP: detalhes?.topP || 1,
        frequencyPenalty: detalhes?.frequencyPenalty || 0,
        presencePenalty: detalhes?.presencePenalty || 0,
        stop: detalhes?.stop || null,
        language: 'pt-br',
    });
};

// Cria o prompt para análise de triagem
const createPrompt = (nome, filas, info, variaveis) => {
    const filasDescricaoFormatada = filas.map(fila => {
        const descricaoFila = fila.descricao || fila.info || 'Descrição não disponível';
        let requerimentos = '';

        if (descricaoFila.toLowerCase().includes('requer:')) {
            // Extrai campos após "requer:"
            requerimentos = descricaoFila.toLowerCase().split('requer:')[1].trim();
            // Normaliza os campos (remove espaços extras, converte para minúsculas)
            requerimentos = requerimentos
                .split(',')
                .map(campo => campo.trim().toLowerCase())
                .join(',');
        } else {
            requerimentos = 'Nenhum dado adicional é necessário.';
        }

        return `- Fila ${fila.queue}, ID: ${fila.id}, Descrição: ${descricaoFila}. ${requerimentos ? `Campos solicitados: ${requerimentos}` : ''
            }`;
    }).join('\n');

    let secaoInstrucoesAdicionais = '';
    if (info && typeof info === 'string' && info.trim() !== '') {
        secaoInstrucoesAdicionais = `Instruções adicionais:\n${info.trim()}\n`;
    }

    const variaveisFormatadas = variaveis?.length > 0
        ? `- Campos permitidos para solicitação: ${variaveis.join(', ')}.`
        : '- Nenhum campo adicional pode ou deve ser solicitado ao usuário.';

    const systemPrompt = `
        Você é um assistente virtual de triagem da Prefeitura, seu nome é ${nome}.
        responsável por identificar a intenção do usuário e encaminhar a solicitação para a fila mais apropriada e solicitar informações apenas quando necessário.

        ## Tarefa
        IMPORTANTE:
        - Retorne APENAS um objeto JSON com as seguintes chaves:
            - "encaminhar": booleano
            - "fila": string ou null
            - "mensagem": string
            - "queueId": número ou null
            - "variaveis": objeto ou {{}}
        - Se a fila NÃO exigir informações adicionais, envie a mensagem direta com confirmação da ação.
        - NÃO inclua perguntas se "encaminhar" for verdadeiro.
        - Não use quebras de linha (\n), barras invertidas (\), ou markdown.
        - Retorne somente o JSON.

        ## Diretrizes Gerais
        1. **Encaminhamento direto:** Se a solicitação se encaixar claramente em uma das filas disponíveis, encaminhe-a diretamente, exceto se a fila solicitar informações adicionais.
        2. **Pergunta clarificadora:** Se a intenção estiver relacionada aos serviços da prefeitura, mas você não tiver certeza da fila correta, peça mais detalhes de forma específica e útil, SOMENTE sobre os campos definidos abaixo.
        3. **Resposta direta:** Se a mensagem for um cumprimento, agradecimento, pergunta geral ou não se enquadrar em nenhuma fila, responda de forma cordial e informativa.

        ## Controle de Tickets de Atendimento
        - Cada interação deve ser associada a um **ticket único de atendimento**
        - Se o ticket recebido for **diferente do ticket atual**, reinicie o contexto da conversa
        - Na **primeira interação de um novo ticket**, inclua o "ticket" na mensagem de resposta
        - Mantenha o histórico de conversa apenas dentro do mesmo ticket

        ## Diretrizes Específicas para Filas
        - Use as informações abaixo para determinar quais filas exigem dados adicionais.
        - Se a descrição incluir "requer:", siga a ordem dos campos listados.
        - Nunca peça informações que não estão listadas nos "Campos solicitados".
        - Encaminhe diretamente se nenhum campo for necessário.

        ## Filas Disponíveis
        Cada fila é um órgão individual. Analise as necessidades específicas de cada fila antes de seguir com a mensagem. Não invente perguntas. Siga fielmente a descrição da fila.
        ${filasDescricaoFormatada}

        ## Informações sobre dados possíveis de coletar. Não são obrigatórios.
        ${variaveisFormatadas}

        ## Instruções Adicionais
        ${secaoInstrucoesAdicionais || ''}

        ## Observações Importantes
        - Não mande perguntas ao encaminhar para uma fila.
        - Analise a intenção do usuário.
        - Evite respostas robóticas ou repetitivas.
        - Utilize linguagem natural, clara e empática.
        - Retorne APENAS o objeto JSON, sem explicações adicionais.
    `;

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}', 'human', '{ticket_de_atendimento}'],
    ]);
};

// Cria a memória com histórico no Redis
function createMemory(agentId) {
    return new BufferMemory({
        chatHistory: new RedisChatMessageHistory({
            sessionId: String(agentId),
            url: process.env.REDIS_URL,
        }),
        memoryKey: 'chat_history',
        returnMessages: true,
        inputKey: 'input',
        outputKey: 'output',
        verbose: true,
    });
}


// Cria o agente Groq
async function createGroqAgent(dataAgente, filas, variaveis) {
    const { id, info = 'Assistente geral', detalhes, nome } = dataAgente;
    variaveis = ['nome', 'problema_relatado'];
    try {
        const memory = createMemory(id);
        const prompt = createPrompt(nome, filas, info, variaveis);

        const model = generateModel(detalhes);

        // Crie uma chain usando LCEL
        const chain = RunnableSequence.from([
            {
                input: (input) => input.input,
                chat_history: async () => {
                    const history = await memory.chatHistory.getMessages();
                    return history;
                },
            },
            prompt,
            model,
        ]);

        // Retorne um wrapper com invoke
        return {
            invoke: async ({ input }) => {
                const response = await chain.invoke({ input });
                await memory.chatHistory.addMessage(response);
                return { response: response.content };
            },
        };
    } catch (error) {
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}

module.exports = { createGroqAgent };