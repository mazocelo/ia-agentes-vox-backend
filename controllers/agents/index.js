const { createGroqAgent } = require("../../agents/groq");
const { Agent } = require("../../Models");
const agents = require('../../agents/shared/agents');

const Modelos = {
    'groq': createGroqAgent,
}

const createAgent = async (clienteId, agente = {}) => {
    const { nome, descricao, especs, modelo } = agente;
    if (!descricao && modelo) {
        throw new Error('Prompt inicial não fornecido.');
    }
    //No futuro aqui deve estar as verificações de cada cliente
    let modelAgent = {
        nome,
        modelo,
        info: descricao,
        detalhes: especs,
        tenant_id: clienteId,
    }

    let resultAgent = await Agent.create(modelAgent);
    modelAgent.id = resultAgent.id;

    const clientAgent = await Modelos[modelo](modelAgent);
    if (!clientAgent) {
        throw new Error('Erro ao criar o agente.');
    }
    
    agents.set(modelAgent.id, clientAgent);
    console.log(`Agente ${modelAgent.nome} criado com sucesso para o cliente ${clienteId}.`);

    return clientAgent;

}


const getAgents = async (clienteId) => {
    const agents = await Agent.findAll({ where: { tenant_id: clienteId } });
    if (!agents) {
        return [];
    }
    return agents;
}


module.exports = { createAgent, getAgents };