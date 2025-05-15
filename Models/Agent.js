const { fn, col } = require('sequelize');  // Importe fn e col
module.exports = (sequelize, DataTypes) => {
  const Agent = sequelize.define('Agent', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    detalhes: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ativo', 'pausado', 'suspenso','inativo'),
      defaultValue: 'pausado',
    },
    api_key: {
      type: DataTypes.UUID,
      defaultValue: fn('gen_random_uuid'), // Correção aqui para usar fn
      allowNull: true,
    },
    software: {
      type: DataTypes.STRING, // ou DataTypes.TEXT, se quiser aceitar textos maiores
      allowNull: true,        // ou false, se quiser obrigatório
    },
  }, {
    tableName: 'agents',
    timestamps: true,
    underscored: true,
  });

  return Agent;
};
