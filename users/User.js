const Sequelize = require("sequelize");
const connection = require("../database/database");
const { DataTypes } = require("sequelize");

const User = connection.define("users", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM("attendant", "client"),
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
  },
});

//se tiver force: true, ele recria a tabela quando a aplicação rodar. false ele nao recria
User.sync({ force: false });

//exemplo de slug:
// caso a categoria tenha como titulo Desenvolvimento Web, o slug seria desenvolvimento-web

// Category.sync({ force: true });

module.exports = User;
