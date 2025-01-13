const express = require("express");
const { Sequelize } = require("sequelize");
const connection = require("../app/database/database");
const Category = require("../categories/Category");
require("dotenv").config();

const Article = connection.define("articles", {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  body: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  summary: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  coverImage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  language: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  relatedArticleId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: "articles",
      key: "id",
    },
  },
});

const ArticleCategory = connection.define("ArticleCategories", {});

Article.belongsToMany(Category, { through: ArticleCategory });
Category.belongsToMany(Article, { through: ArticleCategory });

Article.sync({ force: process.env.SYNC_DATABASE === "true" });
Category.sync({ force: process.env.SYNC_DATABASE === "true" });
ArticleCategory.sync({ force: process.env.SYNC_DATABASE === "true" });

module.exports = Article;
