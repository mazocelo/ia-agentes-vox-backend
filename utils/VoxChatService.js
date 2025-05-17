const axios = require('axios');

let baseURL = 'https://cfe1-179-108-169-35.ngrok-free.app/';

// let baseURL = "https://chat-api.voxcity.com.br"

const chatService = axios.create({
    baseURL,
    timeout: 1000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOXCHAT_API_KEY}`,
    },
});
const getQueues = async (tenantId) => {

    try {
        const response = await chatService.get(`/agent/ia/queues/${tenantId}`);
        if (response.status !== 200) {
            throw new Error('Erro ao buscar filas.');
        }
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar filas:', error);
        throw error;
    }
}

module.exports = {
    getQueues
}
