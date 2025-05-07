
const { Tool } = require('langchain/tools');

export const marcarData = new Tool({
    name: "marcarData",
    description: "Marca uma data (evento ou tarefa) na agenda do usuário.",
    func: async (input) => {
        try {
            const dados = JSON.parse(input);
            console.log("📅 Agendando:", dados);

            // Aqui você integraria com o Google Calendar, DB, etc.
            return `Evento "${dados.evento}" agendado com sucesso para ${dados.dataInicio} - ${dados.dataFim}`;
        } catch (err) {
            console.error("Erro ao executar marcarData:", err);
            return "Erro ao agendar a data.";
        }
    },
});