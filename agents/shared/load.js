const agents = require("../../agents/shared/agents")
const { AuxiliarCreate } = require("./voxchatAuxiliar");


const loadAllAgents = async () => {
    const auxiliar = await AuxiliarCreate();
    if (!auxiliar) {
        throw new Error('Erro ao carregar os VoxChat Auxiliar.');
    }
    agents.set('VoxChat_Auxiliar', auxiliar);
    console.log('VoxChat Auxiliar carregado com sucesso.');
    

}

module.exports = { loadAllAgents };