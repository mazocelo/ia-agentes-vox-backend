/****************************************************
 * npm install @langchain/redis @langchain/core
 *  
 *  IMPLEMENTAR A MEMÓRIA COM REDIS
 * 
    import { RedisChatMessageHistory } from 'langchain/stores/message/redis';
    const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'history',
    chatHistory: new RedisChatMessageHistory({
        sessionId: clienteId,
        url: process.env.REDIS_URL,
    }),
    });
 *********************************************/


const { ChatGroq } = require('@langchain/groq');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
} = require('@langchain/core/prompts');
const agents = require('../shared/agents.js');
const dotenv = require('dotenv');
dotenv.config();

// Generate Model
const generateModel = (especs) => {
    const especification = {
        apiKey: process.env.GROQ_API_KEY,
        model: especs.model || 'llama3-70b-8192',
        temperature: especs.temperature || 0.7,
        maxTokens: especs.maxTokens || 1000,
        topP: especs.topP || 1,
        frequencyPenalty: especs.frequencyPenalty || 0,
        presencePenalty: especs.presencePenalty || 0,
        stop: especs.stop || null,
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
function createMemory(historyMessages = []) {
    const memory = new BufferMemory({
        returnMessages: true,
        memoryKey: 'history',
    });

    if (Array.isArray(historyMessages) && historyMessages.length > 0) {
        memory.chatHistory.addMessages(historyMessages);
    }

    return memory;
}

// Cria um novo agente e registra para o cliente
async function createClientAgent(promptInitial, historyMessages, especs) {
    const memory = createMemory(historyMessages);
    const prompt = await createPrompt(promptInitial);

    const agent = new ConversationChain({
        llm: generateModel(especs),
        prompt,
        memory,
        verbose: true,
    });
    return agent;
}

// Recupera agente de cliente (ou cria, se não existir)
async function getClientAgent(clienteId, promptInitial = 'Assistente geral', historyMessages = [], especs = {}) {
    if (clienteId && agents.size !== 0 && agents.has(clienteId)) {
        console.log(`Agente já existe para o cliente ${clienteId}.`);
        return agents.get(clienteId);
    }

    try {
        const agent = await createClientAgent(promptInitial, historyMessages, especs);
        agents.set(clienteId, agent);
        console.log(`Agente criado para o cliente ${clienteId}.`);
        
        return agent;
    } catch (error) {
        console.error(`Erro ao criar agente para o cliente ${clienteId}:`, error);
        // Fallback: cria um agente temporário sem memória persistente
        console.warn(`Criando agente fallback (sem memória persistente) para o cliente ${clienteId}.`);
        const memory = createMemory();
        const prompt = await createPrompt(promptInitial);
        return new ConversationChain({
            llm: generateModel(especs),
            prompt,
            memory,
            verbose: true,
        });
    }
}

// cria um novo agente do cliente, carregando dados
async function loadAgent(clienteId, promptInitial, historyMessages = [], especs = {}) {
    if (!clienteId) {
        throw new Error('Cliente ID não fornecido.');
    }
    const agent = await createClientAgent(clienteId, promptInitial, historyMessages, especs);
    return agent;

}


module.exports = { getClientAgent, loadAgent };