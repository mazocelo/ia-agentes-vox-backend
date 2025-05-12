const { ChatGroq } = require('@langchain/groq');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    PromptTemplate,
    HumanMessagePromptTemplate,
} = require('@langchain/core/prompts');
const { RedisChatMessageHistory } = require('@langchain/redis');

const dotenv = require('dotenv');
dotenv.config();

// Define as filas disponíveis
const filas = [
    { queue: "Iluminação Pública", descricao: "Solicitações relacionadas à manutenção da iluminação pública." },
    { queue: "Manutenção das Vias", descricao: "Chamados sobre buracos, pavimentação e conservação de ruas." },
    { queue: "IPTU", descricao: "Dúvidas e atendimentos referentes ao imposto predial." },
    { queue: "Certidões Negativas", descricao: "Emissão e consulta de certidões negativas municipais." },
    { queue: "Parcelamento de Dívidas Vencidas", descricao: "Atendimentos para negociação e parcelamento de débitos." },
    { queue: "Denúncias Maus Tratos a Animais", descricao: "Recebimento de denúncias sobre maus-tratos a animais." },
    { queue: "Denúncia de Atividades Irregulares", descricao: "Denúncias sobre comércio ou construções irregulares." },
    { queue: "Secretária de educação", descricao: "Informações e solicitações relacionadas à educação municipal." },
    { queue: "Informações Turísticas", descricao: "Atendimento ao turista e divulgação de atrações locais." },
    { queue: "Secretaria de Saúde", descricao: "Serviços e dúvidas relacionados à saúde pública." },
    { queue: "Comunicações de Trânsito", descricao: "Informações e registros sobre ocorrências no trânsito." },
    { queue: "Ouvidoria e outros assuntos", descricao: "Espaço para sugestões, reclamações e outros temas." },
    { queue: "Tecnologia da Informação/ CPD", descricao: "Suporte técnico e problemas relacionados à TI." },
    { queue: "Fora de Horário de Atendimento", descricao: "Atendimentos recebidos fora do expediente padrão." },
    { queue: "Secretaria de Esportes", descricao: "Atendimentos sobre projetos e eventos esportivos." },
    { queue: "Pagamentos", descricao: "Dúvidas e confirmações sobre pagamentos e tributos." },
];

// Cria o modelo da Groq
const generateModel = (detalhes = {}) => {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: detalhes?.model || 'llama3-70b-8192',
        temperature: detalhes?.temperature || 0.7,
        maxTokens: detalhes?.maxTokens || 1000,
        topP: detalhes?.topP || 1,
        frequencyPenalty: detalhes?.frequencyPenalty || 0,
        presencePenalty: detalhes?.presencePenalty || 0,
        stop: detalhes?.stop || null,
    });
};

// Cria o prompt para análise de triagem
const createPrompt = (filas) => {
    return PromptTemplate.fromTemplate(`
            Você é um sistema de triagem de atendimento da Prefeitura.

            Sua tarefa é analisar a mensagem do usuário e determinar se ela deve ser encaminhada para uma das filas de atendimento humano disponíveis.

            IMPORTANTE:
            - Quando identificar que o assunto da mensagem se encaixa em alguma das filas listadas abaixo, **retorne uma resposta JSON** no seguinte formato. Utilize EXATAMENTE a chave "mensagem" (em minúsculas) para a mensagem de retorno ao usuário:

            \`\`\`json
            {{
                "encaminhar": true,
                "fila": "NOME DA FILA PARA ONDE FOI ENCAMINHADO", // Exemplo de valor para a fila
                "mensagem": "Aqui vai a mensagem informativa para o usuário sobre o encaminhamento." // Novo valor de exemplo, claramente um placeholder para o conteúdo
            }}
            \`\`\`

            - Caso o assunto **não exija encaminhamento**, retorne no seguinte formato, utilizando EXATAMENTE a chave "mensagem" (em minúsculas):

            \`\`\`json
            {{
                "encaminhar": false,
                "fila": null,
                "mensagem": "Aqui vai a resposta ou a próxima pergunta para o usuário." // Novo valor de exemplo
            }}
            \`\`\`

            Filas disponíveis:
            ${filas.map(fila => `- ${fila.queue}: ${fila.descricao}`).join('\n')}

            Responda apenas com o JSON, sem explicações ou comentários adicionais.
            A mensagem ao usuário, contida na chave "mensagem", deve ser clara, útil e cordial.
            Mensagem do usuário: {question}
        `);
};

// Cria a memória com histórico no Redis
function createMemory(agentId) {
    return new BufferMemory({
        returnMessages: true,
        memoryKey: 'history',
        chatHistory: new RedisChatMessageHistory({
            sessionId: String(agentId),
            url: process.env.REDIS_URL,
        }),
    });
}

// Cria o agente Groq
async function createGroqAgent(data) {
    const { id, info = 'Assistente geral', detalhes } = data;
    try {
        const memory = createMemory(id);
        const prompt = createPrompt(filas);

        const agent = new ConversationChain({
            llm: generateModel(detalhes),
            prompt,
            memory,
            // tools: [encaminhar],
            verbose: true,
        });

        return agent;
    } catch (error) {
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}

module.exports = { createGroqAgent };
