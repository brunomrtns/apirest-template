const { Sequelize } = require('sequelize');
require('dotenv').config();

const connection = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

connection.authenticate()
  .then(() => console.log('✅ Conexão com Vercel Postgres bem-sucedida!'))
  .catch(err => console.error('❌ Erro na conexão com o banco:', err));

module.exports = connection;
