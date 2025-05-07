const { getClientAgent } = require("../../agents/groq");

const Modelos = {
    'groq': getClientAgent,
}

const createAgent = async (clienteId, agente = {}) => {
    const { descricao, historyMessages, especs, modelo } = agente;
    if (!descricao && modelo) {
        throw new Error('Prompt inicial não fornecido.');
    }
    const clientAgent = await Modelos[modelo](clienteId, descricao, historyMessages, especs);
    return clientAgent;
}

const loadAgent = async (clienteId, agente = {}) => {
    const { descricao, historyMessages, especs } = agente;
    if (!descricao || !historyMessages) {
        throw new Error('Dados não fornecidos.');
    }
    const clientAgent = await getClientAgent(clienteId, descricao, historyMessages, especs);
    return clientAgent;
}


module.exports = { createAgent };