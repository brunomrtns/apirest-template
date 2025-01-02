const Sequelize = require("sequelize");
const connection = require("../app/database/database");

const Message = connection.define("messages", {
  chatId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
});

Message.sync({ force: false });

module.exports = Message;
