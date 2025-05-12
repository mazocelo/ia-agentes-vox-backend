const agents = require("../../agents/shared/agents")
const { createGroqAgent } = require("../../agents/groq");
const { Agent } = require("../../Models");

const Modelos = {
    'groq': createGroqAgent,
}

const loadAllAgents = async () => {
    const agentsList = await Agent.findAll();
    if (!agentsList) {
        return;
    }
    for (const agentData of agentsList) {
        try {
            const { dataValues } = agentData;
            const clientAgent = await Modelos[dataValues.modelo](dataValues);
            if (!clientAgent) {
                throw new Error('Erro ao criar o agente.');
            }
            const agent = Object.assign(clientAgent, dataValues);
            agents.set(agent.id, agent);
            console.log(`Agente ${agent.nome} carregado com sucesso.`);
        } catch (error) {
            console.error(`Erro ao carregar o agente `, error);
        }
    }
}

module.exports = { loadAllAgents };