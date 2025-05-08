const agents = require("../../agents/shared/agents")


const askAgent = async (agentData, question) => {
    let agent = agents.get(agentData.id);
    if (!agent) {
        //fazer load depois
    }
    
    try {
        const response = await agent.call({ input: question });
        return response;
    } catch (error) {
        console.error(`Erro ao perguntar ao agente ${agentData.nome}:`, error);
        throw new Error(`Erro ao perguntar ao agente: ${error.message}`);
    }
}