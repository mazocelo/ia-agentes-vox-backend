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
            const clientAgent = await Modelos[agentData.modelo](agentData);
            if (!clientAgent) {
                throw new Error('Erro ao criar o agente.');
            }
            agents.set(agentData.id, clientAgent);
            console.log(`Agente ${agentData.nome} carregado com sucesso.`);
        } catch (error) {
            console.error(`Erro ao carregar o agente ${agentData.nome}:`, error);
        }
    }
 }

 module.exports = { loadAllAgents };