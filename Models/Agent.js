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
      type: DataTypes.ENUM('ativo', 'inativo', 'suspenso'),
      defaultValue: 'ativo',
    },
    api_key: {
      type: DataTypes.UUID,
      defaultValue: fn('gen_random_uuid'), // Correção aqui para usar fn
      allowNull: true,
    },
  }, {
    tableName: 'agents',
    timestamps: true,
    underscored: true,
  });

  return Agent;
};
