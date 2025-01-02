const Sequelize = require("sequelize");
const connection = require("../app/database/database");
require("dotenv").config(); // Load environment variables

const Category = connection.define("categories", {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

Category.sync({ force: process.env.SYNC_DATABASE === "true" });

module.exports = Category;
