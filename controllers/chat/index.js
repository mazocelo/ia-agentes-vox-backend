const agents = require("../../agents/shared/agents")
const { answers } = require("../../agents/shared/answer")

const askAgent = async (agentData, ticket, question) => {
    let agent = agents.get(agentData.id);  // Carrega o agente com base no ID
    if (!agent) {
        // Se não houver agente, ele deve ser carregado, você pode adicionar uma lógica de fallback aqui
        // Exemplo: agent = await loadAgent(agentData);
        throw new Error('Agente não existe ou está pausado.');
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

module.exports = { askAgent };
