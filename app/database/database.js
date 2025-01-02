const { Sequelize } = require("sequelize");
require("dotenv").config();

// Pega a URL de conexão do banco de dados a partir do .env
const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres", // Defina o dialeto como postgres, pois você está usando PostgreSQL
  logging: false, // Se você quiser desativar o log SQL
});

sequelize
  .authenticate()
  .then(() => console.log("🟢 Conexão com o banco de dados bem-sucedida"))
  .catch((err) => console.error("🔴 Erro ao conectar no banco:", err));

module.exports = sequelize;
