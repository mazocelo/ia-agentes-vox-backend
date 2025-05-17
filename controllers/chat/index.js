const agents = require("../../agents/shared/agents")
const { answers } = require("../../agents/shared/answer")
const { Agent } = require("../../Models")
const { getQueues } = require('../../utils/VoxChatService');
const { createGroqAgent } = require("../../agents/groq");


const DEFAULT_VARIABLES = ['nome', 'problema_relatado','endereço'];

const Modelos = {
    'groq': createGroqAgent,
}
const askAgent = async (agentData, ticket, question) => {
    let agent = agents.get(ticket);  // Carrega o agente com base no ID
    if (!agent) {
        // Se não houver agente, ele deve ser carregado, você pode adicionar uma lógica de fallback aqui
        // Exemplo: agent = await loadAgent(agentData);
        agent = await startAgent(agentData.id, ticket)
    }
    if (agent.software !== 'voxchat') {
        throw new Error('Agente não é do tipo VoxChat.');
    }
    try {
        let modelo = agent.modelo;  // Modelo que identifica qual função de resposta usar

        const response = await answers[modelo](question, ticket, agent);  // Chama a função de resposta com o modelo e agente
        if (!response) {
            throw new Error('Resposta vazia do agente.');
        }
        console.log(`Resposta do agente ${agentData.nome}:`, response);

        return response;  // Retorna a resposta do agente
    } catch (error) {
        console.error(`Erro ao perguntar ao agente ${agentData.nome}:`, error);
        throw new Error(`Erro ao perguntar ao agente: ${error.message}`);
    }
}

const startAgent = async (id, ticket) => {
    const agent = await Agent.findOne({ where: { id } });
    if (!agent) {
        return null;
    }
    const filas = await getQueues(agent.tenant_id);
    if (!filas) {
        throw new Error('Filas não encontradas.');
    }
    // Verifica se o modelo é válido
    if (!Modelos[agent.modelo]) {
        throw new Error('Modelo de agente inválido.');
    }
    const { dataValues } = agent;
    const clientAgent = await Modelos[agent.modelo](dataValues, filas, DEFAULT_VARIABLES, ticket);
    if (!clientAgent) {
        throw new Error('Erro ao criar o agente.');
    }

    // Adiciona o agente à memória
    const assignedAgent = Object.assign(clientAgent, dataValues);
    agents.set(ticket, assignedAgent);
    console.log(`Agente ${assignedAgent.nome} carregado com sucesso.`);
    return assignedAgent;
}

const stopAgent = async (id, ticket) => {
    const agent = await Agent.findOne({ where: { id } });
    if (!agent) {
        throw new Error('Agente não encontrado.');
    }
    // Verifica se o agente já está pausado
    if (agent.status === 'pausado') {
        throw new Error('Agente já está pausado.');
    }
    let clientAgent = agents.get(agent.id);
    if (!clientAgent) {
        throw new Error('Agente não encontrado na memória.');
    }
    // Pausa o agente
    // clientAgent.memory.clear();
    agent.status = 'pausado';
    await agent.save();
    // Remove o agente da memória
    agents.delete(agent.id);
    console.log(`Agente ${agent.nome} pausado com sucesso.`);
    return agent;
}

module.exports = { askAgent, startAgent, stopAgent };
