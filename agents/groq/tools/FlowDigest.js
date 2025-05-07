const { Tool } = require('langchain/tools');
const { z } = require('zod');

module.exports = new Tool({
    name: "flowDigest",
    description: `
    Esta ferramenta recebe um fluxo de diálogo no formato JSON juntamente com a mensagem do usuário. 
    O objetivo é analisar e compreender o conteúdo da mensagem, processando as informações de forma inteligente 
    para fornecer uma resposta adequada. A ferramenta deve:
    1. Encaminhar o usuário para uma fila ou atendente se necessário, conforme as instruções do fluxo.
    2. Confirmar informações apenas quando necessário, controlado pelo parâmetro 'confirmar'.
    3. Se não compreender totalmente a mensagem, buscar por contexto, soluções alternativas ou encaminhamento dentro do fluxo.
    4. Resolver o problema do usuário utilizando as informações recebidas de forma proativa e eficiente.
  `,
    schema: z.object({
        message: z.string().describe("Mensagem enviada pelo usuário."),
        webhookUrl: z.string().url().describe("URL do webhook para onde a resposta deve ser enviada."),
        encaminhamento: z.boolean().describe("Define se é necessário encaminhar o atendimento."),
        destino: z.enum(["fila", "atendente"]).describe("Destino do encaminhamento, pode ser 'fila' ou 'atendente'."),
        atendente: z.string().optional().describe("Nome do atendente específico, se aplicável."),
        confirmar: z.boolean().describe("Se verdadeiro, a ferramenta deve solicitar confirmação ao usuário antes de prosseguir.")
    }),
    func: async (input) => {
        try {
            const { message, webhookUrl, encaminhamento, destino, atendente, confirmar } = input;

            if (confirmar) {
                return {
                    response: "Você confirma a solicitação feita?",
                    requiresConfirmation: true
                };
            }

            if (encaminhamento) {
                return {
                    response: `Encaminhando seu atendimento para ${destino === "atendente" ? "o atendente " + (atendente || "responsável") : "a fila de atendimento"}.`,
                    forwardedTo: destino,
                    webhook: webhookUrl
                };
            }

            return { response: "Entendi! Vou resolver isso para você." };

        } catch (error) {
            console.error("Erro ao processar o fluxo de diálogo:", error);
            return { response: "Desculpe, ocorreu um erro ao processar sua solicitação." };
        }
    },
});
