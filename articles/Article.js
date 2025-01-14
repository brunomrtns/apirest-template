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
    type: Sequelize.TEXT, // Para textos longos
    allowNull: false,
  },
  summary: {
    type: Sequelize.TEXT, // Alterado de STRING para TEXT
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

// Associação entre Article e Category
const ArticleCategory = connection.define("ArticleCategories", {});

Article.belongsToMany(Category, { through: ArticleCategory });
Category.belongsToMany(Article, { through: ArticleCategory });

// Sincronização das tabelas (controlada pelo ambiente)
const syncOptions = { alter: process.env.SYNC_DATABASE === "true" };

Article.sync(syncOptions);
Category.sync(syncOptions);
ArticleCategory.sync(syncOptions);

module.exports = Article;
