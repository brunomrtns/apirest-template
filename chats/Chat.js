const Sequelize = require("sequelize");
const connection = require("../app/database/database");

const Chat = connection.define("chats", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  attendantId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  clientId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

Chat.sync({ force: process.env.SYNC_DATABASE });

module.exports = Chat;
