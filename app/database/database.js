const { Sequelize } = require("sequelize");
const pg = require("pg");
require("dotenv").config();

// Verifica se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error("🔴 DATABASE_URL não definida no arquivo .env");
  process.exit(1);
}

// Pega a URL de conexão do banco de dados a partir do .env
const databaseUrl = process.env.DATABASE_URL;

// Singleton para garantir que a conexão seja criada apenas uma vez
let sequelize;

if (!global.sequelize) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres", // Usando PostgreSQL
    logging: false, // Desativa logs SQL
    dialectModule: pg, // Usa o driver pg
    pool: {
      max: 5, // Máximo de conexões no pool
      min: 0, // Mínimo de conexões
      acquire: 30000, // Tempo máximo para adquirir conexão (30s)
      idle: 10000, // Tempo antes de liberar conexão inativa (10s)
    },
  });

  sequelize
    .authenticate()
    .then(() => console.log("🟢 Conexão com o banco de dados bem-sucedida"))
    .catch((err) => {
      console.error("🔴 Erro ao conectar no banco:", err);
      process.exit(1); // Encerra a aplicação se não conseguir conectar
    });

  global.sequelize = sequelize; // Armazena no objeto global para evitar múltiplas instâncias
} else {
  sequelize = global.sequelize;
}

module.exports = sequelize;
