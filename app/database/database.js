const { Sequelize } = require("sequelize");
const pg = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("🔴 DATABASE_URL não definida no arquivo .env");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (!global.sequelize) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: false,
    dialectModule: pg,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  sequelize
    .authenticate()
    .then(() => console.log("🟢 Conexão com o banco de dados bem-sucedida"))
    .catch((err) => {
      console.error("🔴 Erro ao conectar no banco:", err);
      process.exit(1);
    });

  global.sequelize = sequelize;
} else {
  sequelize = global.sequelize;
}

module.exports = sequelize;
