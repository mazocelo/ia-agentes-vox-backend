const { ChatGroq } = require('@langchain/groq');
const { RunnableSequence } = require('@langchain/core/runnables');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { BufferMemory } = require('langchain/memory');
const { RedisChatMessageHistory } = require('@langchain/redis');
const dotenv = require('dotenv');

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

// Gera o modelo da Groq
function generateModel(detalhes = {}) {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        ...DEFAULT_MODEL_SETTINGS,
        ...detalhes,
    });
}

// Cria o prompt para análise de triagem

function createPrompt() {
    const systemPrompt = `
    Sua tarefa é analisar as descrições fornecidas e extrair os campos solicitados, então organizar tudo em um formato JSON específico.

    ## Formato de Saída Esperado:
    [
        {{
            "nome": "Nome da fila",
            "descricao": "Descrição detalhada da fila",
            "id": "Identificador único da fila (string)",
            "requerimentos": ["campo1", "campo2"] // lista de strings
        }}
    ]

    ## Regras:
    - SEMPRE retorne um array JSON válido.
    - NÃO inclua texto adicional fora do bloco JSON.
    - Os IDs devem ser sempre tratados como strings (mesmo se forem números).
    - Use apenas os campos especificados: "nome", "descricao", "id", "requerimentos".
    - Considere os campos listados após "requer:" como **campos gerais** aplicáveis a todas as filas.
    - Se a **descrição de alguma fila mencionar campos específicos**, inclua esses campos **além ou no lugar** dos gerais.
    - Campos específicos têm prioridade sobre campos gerais para aquela fila.

    ## Exemplo de Entrada:
    id: 1, nome: "Atendimento ao Cidadão", descricao: "Para solicitações gerais. Informe seu nome completo, CPF e motivo da solicitação."
    id: 2, nome: "Ouvidoria", descricao: "Recebe reclamações e sugestões."
    requer:
    1. Nome completo
    2. CPF
    3. Motivo da solicitação

    ## Exemplo de Saída:
    [
       {{
            "nome": "Atendimento ao Cidadão",
            "descricao": "Para solicitações gerais. Informe seu nome completo, CPF e motivo da solicitação.",
            "id": "1",
            "requerimentos": ["nome completo", "CPF", "motivo da solicitação"]
        }},
        {{
            "nome": "Ouvidoria",
            "descricao": "Recebe reclamações e sugestões.",
            "id": "2",
            "requerimentos": ["nome completo", "CPF", "motivo da solicitação"]
        }}
    ]
`;
    return ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
    ]);
}

// Cria a memória com histórico no Redis
function createMemory(ticket) {
    if (!process.env.REDIS_URL) {
        throw new Error('URL do Redis não configurada.');
    }

    return new BufferMemory({
        chatHistory: new RedisChatMessageHistory({
            sessionId: String(ticket),
            url: process.env.REDIS_URL,
        }),
        memoryKey: 'chat_history',
        returnMessages: false,
        inputKey: 'input',
        outputKey: 'output',
        verbose: false,
    });
}

// Cria o agente Groq
async function AuxiliarCreate() {
    try {
        const memory = createMemory(`VoxChat_Auxiliar`);
        const prompt = createPrompt();
        const model = generateModel();

        const chain = RunnableSequence.from([
            {
                input: (input) => input.input,
                chat_history: async () => {
                    const history = await memory.chatHistory.getMessages();
                    return [];
                },
            },
            prompt,
            model,
        ]);

        return {
            invoke: async ({ input }) => {
                const response = await chain.invoke({ input });
                return { response: response.content };
            },
        };
    } catch (error) {
        console.error('Erro ao criar agente:', error.message);
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}

module.exports = { AuxiliarCreate };