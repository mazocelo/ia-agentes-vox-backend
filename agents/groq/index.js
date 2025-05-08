const { ChatGroq } = require('@langchain/groq');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
} = require('@langchain/core/prompts');
const { RedisChatMessageHistory } = require('@langchain/redis');
const flowDigest = require("./tools/FlowDigest.js")
const dotenv = require('dotenv');
dotenv.config();

// Generate Model
const generateModel = (detalhes = {}) => {
    const especification = {
        apiKey: process.env.GROQ_API_KEY,
        model: detalhes?.model || 'llama3-70b-8192',
        temperature: detalhes?.temperature || 0.7,
        maxTokens: detalhes?.maxTokens || 1000,
        topP: detalhes?.topP || 1,
        frequencyPenalty: detalhes?.frequencyPenalty || 0,
        presencePenalty: detalhes?.presencePenalty || 0,
        stop: detalhes?.stop || null,
    };
    const model = new ChatGroq(especification);
    return model;
}

// Cria o prompt padrão
const createPrompt = (promptInitial) => {
    return ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
            `You are a helpful assistant. You will be given a prompt and you will respond to it. The prompt is: ${promptInitial}`
        ),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);
};

// Cria a memória para um cliente
function createMemory(agentId) {
    return new BufferMemory({
        returnMessages: true,
        memoryKey: 'history',
        chatHistory: new RedisChatMessageHistory({
            sessionId: agentId,
            url: process.env.REDIS_URL,
        }),
    });
}

// Cria um novo agente e registra para o cliente
async function createClientAgent(agentId, promptInitial, detalhes) {
    const memory = createMemory(agentId);
    const prompt = createPrompt(promptInitial);

    const agent = new ConversationChain({
        tools: [flowDigest],
        llm: generateModel(detalhes),
        prompt,
        memory,
        verbose: true,
    });

    return agent;
}

// Recupera agente de cliente (ou cria, se não existir)
async function createGroqAgent(agent) {
    const { id, info = 'Assistente geral', detalhes } = agent;
    try {
        const agent = await createClientAgent(id, info, detalhes);
        console.log(`Agente criado para o cliente ${id}.`);
        return agent;
    } catch (error) {
        console.error(`Erro ao criar agente para o cliente ${id}:`, error);
        throw new Error(`Erro ao criar agente: ${error.message}`);
    }
}



module.exports = { createGroqAgent, };