module.exports = async function answer(question, ticket, agent) {
    console.log('ticket:', ticket);
    try {
        // Invoca o agente com a pergunta e o ticket
        let response = await agent.invoke({
            input: `Ticket de atendimento número: ${ticket} \nMensagem do usuário: ${question} `
        });

        // Parseia a resposta
        const parsedResponse = safeParseJSON(response.response);

        // Retorna o JSON validado
        return parsedResponse;
    } catch (error) {
        console.error('Erro ao processar resposta:', error.message);
        throw new Error('Erro ao perguntar ao agente');
    }
};

function safeParseJSON(data) {
    let jsonString;

    // Se for objeto com .response, extrai
    if (typeof data === 'object' && data !== null && 'response' in data) {
        jsonString = data.response;
    } else if (typeof data === 'string') {
        jsonString = data;
    } else {
        throw new Error('Entrada inválida para parse');
    }

    try {
        // Remove quebras de linha e espaços extras
        jsonString = jsonString.replace(/\n/g, ' ').trim();

        // Encontra o JSON usando regex
        const jsonMatch = jsonString.match(/({.*})/s); // Procura por `{...}` no texto
        if (!jsonMatch) {
            throw new Error('Nenhum JSON encontrado na resposta');
        }

        // Parseia o JSON extraído
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Erro ao parsear JSON após limpeza:', error.message);
        console.error('Texto original:', jsonString);
        throw new Error('Falha ao processar resposta do agente');
    }
}