const { Agent } = require("../../Models");


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

const deleteAgent = async (clienteId, id) => {
    const agent = await Agent.findOne({ where: { id, tenant_id: clienteId } });
    if (!agent) {
        return null;
    }
    await agent.destroy();
    return true;
}


module.exports = { createAgent, getAgents, editAgent,  deleteAgent, };




