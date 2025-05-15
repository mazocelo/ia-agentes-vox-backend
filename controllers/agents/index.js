const { createGroqAgent } = require("../../agents/groq");
const { Agent } = require("../../Models");
const agents = require('../../agents/shared/agents');
const { getQueues } = require('../../utils/VoxChatService');
const Modelos = {
    'groq': createGroqAgent,
}

const createAgent = async (clienteId, agente = {}) => {
    const { nome, descricao, especs, modelo, software, status } = agente;
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
        software,
        status,
    }

    let resultAgent = await Agent.create(modelAgent);
    const { dataValues } = resultAgent;


    return dataValues;

}


const getAgents = async (clienteId, id = null) => {
    if (id) {
        const agent = await Agent.findOne({ where: { id, tenant_id: clienteId } });
        if (!agent) {
            return null;
        }
        return agent;
    } else {
        const agents = await Agent.findAll({ where: { tenant_id: clienteId } });
        if (!agents) {
            return [];
        }
        return agents;
    }
}

const editAgent = async (id, agente = {}) => {
    const { nome, descricao, especs, modelo, software } = agente;
    if (!software && !modelo && !nome) {
        throw new Error('Dados insuficientes ou não fornecidos.');
    }
    //No futuro aqui deve estar as verificações de cada cliente
    let modelAgent = {
        nome,
        modelo,
        info: descricao,
        detalhes: especs,
        software,
    }

    let resultAgent = await Agent.update(modelAgent, { where: { id } });
    if (!resultAgent) {
        throw new Error('Erro ao editar o agente.');
    }
    return resultAgent;
}

const startAgent = async (id) => {
    const agent = await Agent.findOne({ where: { id } });
    if (!agent) {
        return null;
    }
    const filas = await getQueues(agent.tenant_id);
    if (!filas) {
        throw new Error('Filas não encontradas.');
    }
    // Verifica se o agente já está ativo
    if (agent.status === 'ativo') {
        throw new Error('Agente já está ativo.');
    }
    // Verifica se o modelo é válido
    if (!Modelos[agent.modelo]) {
        throw new Error('Modelo de agente inválido.');
    }
    const { dataValues } = agent;
    const clientAgent = await Modelos[agent.modelo](dataValues, filas);
    if (!clientAgent) {
        throw new Error('Erro ao criar o agente.');
    }

    agent.status = 'ativo';
    await agent.save();

    // Adiciona o agente à memória
    const assignedAgent = Object.assign(clientAgent, dataValues);
    agents.set(assignedAgent.id, assignedAgent);
    console.log(`Agente ${assignedAgent.nome} carregado com sucesso.`);
    return agent;
}

const deleteAgent = async (clienteId, id) => {
    const agent = await Agent.findOne({ where: { id, tenant_id: clienteId } });
    if (!agent) {
        return null;
    }
    await agent.destroy();
    return true;
}

const stopAgent = async (id) => {
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

module.exports = { createAgent, getAgents, editAgent, startAgent, deleteAgent, stopAgent };




