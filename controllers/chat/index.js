const agents = require("../../agents/shared/agents")
const { answers } = require("../../agents/shared/answer")

const askAgent = async (agentData, question) => {
    let agent = agents.get(agentData.id);  // Carrega o agente com base no ID
    if (!agent) {
        // Se não houver agente, ele deve ser carregado, você pode adicionar uma lógica de fallback aqui
        // Exemplo: agent = await loadAgent(agentData);
    }
    try {
        let modelo = agent.modelo;  // Modelo que identifica qual função de resposta usar
        console.log(modelo);
        const response = await answers[modelo](question, agent);  // Chama a função de resposta com o modelo e agente
        if(!response) {
            throw new Error('Resposta vazia do agente.');
        }
        let result = JSON.parse(response.response);  // Tenta analisar a resposta como JSON
        console.log(`Resposta do agente ${agentData.nome}:`, response);
        return result;  // Retorna a resposta do agente
    } catch (error) {
        console.error(`Erro ao perguntar ao agente ${agentData.nome}:`, error);
        throw new Error(`Erro ao perguntar ao agente: ${error.message}`);
    }
}

module.exports = { askAgent };
