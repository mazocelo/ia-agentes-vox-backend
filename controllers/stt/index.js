const { handleAudio } = require('./audioToText');

const stt = async (clientId, audio) => {
    if (!clientId || !audio) {
        throw new Error('All fields are required');
    }
    try {
        const transcription = await handleAudio(clientId,audio); // Corrigido: só passa o caminho do áudio
        return transcription;
    } catch (error) {
        console.error('Erro em stt:', error);
        throw new Error('Internal server error');
    }
};

module.exports = {
    stt,
};
