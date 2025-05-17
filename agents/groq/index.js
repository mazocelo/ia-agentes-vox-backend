const { ChatGroq } = require('@langchain/groq');
const { RunnableSequence } = require('@langchain/core/runnables');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { BufferMemory } = require('langchain/memory');
const { RedisChatMessageHistory } = require('@langchain/redis');
const dotenv = require('dotenv');
const agents = require('../shared/agents');

dotenv.config();

// Constantes globais
const DEFAULT_MODEL_SETTINGS = {
    model: 'gemma2-9b-it',
    temperature: 0.2,
    maxTokens: 250,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stop: null,
    language: 'pt-br',
};

function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}


async function formatFilas(filas) {
    if (!Array.isArray(filas)) {
        throw new Error('Entrada inválida: "filas" deve ser um array.');
    }

    const auxiliar = agents.get('VoxChat_Auxiliar');
    if (!auxiliar) {
        return filas.map(fila => `- ${fila.nome || 'Sem Nome'} (${fila.id || 'Sem ID'}): ${fila.descricao || 'Sem Descrição'}`).join('\n');
    }

    try {
        // Monta a entrada com base nas filas
        const input = `
            ${filas.map(fila => `- nome: ${fila.queue || 'Sem Nome'}, descricao:${fila.info || 'Sem Descrição'}, id:${fila.id || 'Sem ID'}`).join('\n')}`.trim();

        console.log('Entrada para o agente auxiliar:', input);
        const response = await auxiliar.invoke({ input });
        console.log('Resposta do agente auxiliar:', response);

        if (!response?.response) {
            throw new Error('Resposta vazia ou inválida do agente.');
        }

        let jsonResponse = response.response.trim();

        // Tenta parsear diretamente como JSON primeiro
        try {
            const parsed = JSON.parse(jsonResponse);
            return parsed;
        } catch (directParseError) {
            // Se falhar, tenta extrair via markdown
            const jsonMatch = jsonResponse.match(/```json\\s*([\\s\\S]*?)\\s*```/i);
            if (!jsonMatch) {
                throw new Error('Resposta inválida. Bloco JSON não encontrado.');
            }
            const jsonString = jsonMatch[1].trim();
            return JSON.parse(jsonString);
        }

    } catch (error) {
        console.error('Erro ao processar filas:', error);
        return 'Erro ao processar as filas.';
    }
}

async function createPrompt(nome, filas, info, variaveis) {
    const filasDescricaoFormatada = await formatFilas(filas).catch((error) => {
        console.error('Erro ao formatar filas:', error.message);
        return filas.map(fila => `- ${fila.nome} (${fila.id}): ${fila.descricao}`).join('\n');
    });

    console.log('Filas formatadas:', filasDescricaoFormatada);

    const secaoInstrucoesAdicionais = info?.trim() ? `Instruções adicionais:\n${info.trim()}\n` : '';
    const variaveisFormatadas = variaveis?.length > 0
        ? `- Campos permitidos para solicitação: ${variaveis.join(', ')}.`
        : '- Nenhum campo adicional pode ou deve ser solicitado ao usuário.';

    // Dentro da função createPrompt
    const filasString = JSON.stringify(filasDescricaoFormatada, null, 2)
        .replace(/{/g, '{{')
        .replace(/}/g, '}}');

    // const variaveisFormatadas = ...;

    const systemPrompt = `
        Você é um assistente virtual de triagem da Prefeitura, seu nome é ${nome}.
        Responsável por identificar a intenção do usuário e encaminhar a solicitação para a fila mais apropriada.

        ## Tarefa
        Retorne APENAS um objeto JSON com as seguintes chaves:
        - "encaminhar": booleano (true se todos os campos necessários forem fornecidos)
        - "fila": nome da fila escolhida (string)
        - "mensagem": mensagem ao usuário (string)
        - "queueId": ID da fila escolhida (string)
        - "variaveis": objeto com campos coletados ou a serem solicitados

        ## Regras Importantes
        1. NÃO invente filas — use apenas as disponíveis na lista abaixo.
        2. Se a intenção do usuário for clara, selecione a fila mais adequada.
        3. Consulte os campos em "requerimentos" da fila escolhida.
        4. Peça os campos faltantes UM POR VEZ, com perguntas claras e objetivas.
        5. Ao finalizar a coleta de todos os campos, envie uma mensagem de confirmação e defina "encaminhar": true.
        6. Não inclua perguntas se "encaminhar" for verdadeiro.

        ## Filas Disponíveis
        ${filasString}

        ## Campos Permitidos para Coleta
        Os campos a seguir são obrigatórios para cada fila:
        ${variaveisFormatadas}

        ## Instruções Adicionais
        ${secaoInstrucoesAdicionais}

        ## Observações Importantes
        - Nunca invente filas ou campos extras.
        - Use linguagem natural, empática e objetiva.
        - Mantenha controle do histórico para evitar repetição de perguntas.
    `.trim();

    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
    ]);
}

function createMemory(ticket, agenteId) {
    if (!process.env.REDIS_URL) {
        throw new Error('URL do Redis não configurada.');
    }

    const sessionId = `${String(ticket)}_${String(agenteId)}`;

    return new BufferMemory({
        chatHistory: new RedisChatMessageHistory({
            sessionId,
            url: process.env.REDIS_URL,
        }),
        memoryKey: 'chat_history',
        returnMessages: true,
        inputKey: 'input',
        outputKey: 'output',
        verbose: true,
    });
}

async function createGroqAgent(dataAgente, filas, variaveis, ticket) {
    const { id, info = 'Assistente geral', detalhes, nome } = dataAgente;

    try {
        const memory = createMemory(ticket, id);
        const prompt = await createPrompt(nome, filas, info, variaveis);
        const model = generateModel(detalhes);

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

async function clearSessionMemory(ticket, agenteId) {
    try {
        const sessionId = `${String(ticket)}_${String(agenteId)}`;
        const redisChatHistory = new RedisChatMessageHistory({
            sessionId,
            url: process.env.REDIS_URL,
        });

        await redisChatHistory.clear();

        console.log(`Memória da sessão ${sessionId} foi limpa com sucesso.`);
    } catch (error) {
        throw new Error(`Erro ao limpar a memória da sessão: ${error.message}`);
    }
}

module.exports = {
    createGroqAgent,
    clearSessionMemory,
};