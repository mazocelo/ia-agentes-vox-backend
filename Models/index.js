const Sequelize = require('sequelize');
const sequelize = require('../config/database'); // caminho para seu sequelize.js
const db = {};

db.Agent = require('./Agent')(sequelize, Sequelize.DataTypes);

// se tiver mais modelos, adicione aqui
// db.OutroModel = require('./OutroModel')(sequelize, Sequelize.DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
