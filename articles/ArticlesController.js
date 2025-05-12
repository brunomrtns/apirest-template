const express = require("express");
const router = express.Router();
const Category = require("../categories/Category");
const Article = require("./Article");
const slugify = require("slugify");
const auth = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const { Op, Sequelize } = require("sequelize");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "articles", // Pasta no Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"], // Formatos permitidos
    resource_type: "image", // Certifique-se de que está configurado como imagem
  },
});

const upload = multer({ storage });

router.use((req, res, next) => {
  console.log(`Request URL: ${req.originalUrl}`);
  next();
});

router.post("/upload", upload.single("file"), (req, res) => {
  console.log("Arquivo recebido:", req.file); // Log do arquivo enviado

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const link = req.file.path; // URL gerada pelo Cloudinary
  console.log("URL gerada:", link);

  return res.status(200).json({
    link, // Resposta para o Froala
  });
});

router.get("/admin/articles", (req, res) => {
  Article.findAll({
    include: [{ model: Category }],
    order: [["id", "DESC"]],
  })
    .then((articles) => {
      res.json(articles);
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

router.post(
  "/articles/save",
  auth,
  upload.single("coverImage"), // Middleware do Cloudinary
  async (req, res) => {
    try {
      const { title, body, categories, summary, language, relatedArticleId } =
        req.body;

      // URL da imagem gerada pelo Cloudinary
      const coverImage = req.file ? req.file.path : null;

      if (!title || !body || !categories || !language) {
        return res.status(400).json({
          error: "Title, body, categories, and language are required",
        });
      }

      // Dados do artigo a serem salvos no banco de dados
      const articleData = {
        title: title,
        slug: slugify(title),
        body: body,
        summary: summary,
        coverImage: coverImage, // URL do Cloudinary
        language: language,
        relatedArticleId: relatedArticleId ? relatedArticleId : null,
      };

      // Salva o artigo no banco
      const newArticle = await Article.create(articleData);

      // Relaciona o artigo com as categorias
      const categoryIds = categories
        .split(",")
        .map((id) => parseInt(id.trim()));
      const categoryInstances = await Category.findAll({
        where: { id: categoryIds },
      });

      await newArticle.addCategories(categoryInstances);

      res.status(201).json({ id: newArticle.id, title: newArticle.title });
    } catch (err) {
      console.error("Error creating article:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

const deleteArticleAndRelated = async (id, transaction) => {
  const relatedArticles = await Article.findAll({
    where: {
      relatedArticleId: id,
    },
    transaction,
  });

  for (const article of relatedArticles) {
    await deleteArticleAndRelated(article.id, transaction);
  }

  await Article.destroy({
    where: { id: id },
    transaction,
  });
};

router.post("/articles/delete", auth, (req, res) => {
  const id = req.body.id;

  if (id !== undefined && !isNaN(id)) {
    Article.sequelize
      .transaction((transaction) => {
        return Article.findAll({
          where: {
            [Op.or]: [{ id: id }, { relatedArticleId: id }],
          },
          transaction,
        }).then((articles) => {
          const updatePromises = articles.map((article) => {
            return article.update({ relatedArticleId: null }, { transaction });
          });

          return Promise.all(updatePromises).then(() => {
            const deletePromises = articles.map((article) => {
              return article.destroy({ transaction });
            });

            return Promise.all(deletePromises);
          });
        });
      })
      .then(() => {
        res.status(204).send();
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  } else {
    res.status(400).json({ error: "Invalid ID" });
  }
});

router.get("/admin/articles/search", async (req, res) => {
  const { title } = req.query;

  try {
    const articles = await Article.findAll({
      where: {
        title: {
          [Op.like]: `%${title}%`,
        },
      },
      include: [{ model: Category }],
      order: [["id", "DESC"]],
    });

    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles by title:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/admin/articles/edit/:id", auth, (req, res) => {
  var id = req.params.id;
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
  } else {
    Article.findByPk(id, {
      include: [Category],
    })
      .then((article) => {
        if (article != undefined) {
          Category.findAll().then((categories) => {
            res.json({ article: article, categories: categories });
          });
        } else {
          res.status(404).json({ error: "Article not found" });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  }
});

router.post(
  "/articles/update",
  auth,
  upload.single("coverImage"), // Middleware do Cloudinary
  async (req, res) => {
    try {
      const {
        id,
        title,
        body,
        categories,
        summary,
        language,
        relatedArticleId,
      } = req.body;

      // Se uma nova imagem foi enviada, usa a URL do Cloudinary
      const coverImage = req.file ? req.file.path : req.body.coverImage;

      if (!id || !title || !body || !categories) {
        return res.status(400).json({
          error: "ID, title, body, and categories are required",
        });
      }

      // Atualiza os dados do artigo no banco
      const updatedArticle = await Article.update(
        {
          title: title,
          slug: slugify(title),
          body: body,
          summary: summary,
          coverImage: coverImage, // URL atualizada
          language: language,
          relatedArticleId: relatedArticleId || null,
        },
        { where: { id: id } }
      );

      if (updatedArticle[0] === 1) {
        const article = await Article.findByPk(id);
        let categoryIds = "";
        // Atualiza as categorias, se fornecidas
        if (categories && categories.length > 0) {
          if (Array.isArray(categories)) {
            // Se `categories` for um array, use-o diretamente
            categoryIds = categories.map((id) => parseInt(id));
          } else if (typeof categories === "string") {
            // Se `categories` for uma string, divida-a em um array
            categoryIds = categories
              .split(",")
              .map((id) => parseInt(id.trim()));
          } else {
            // Caso contrário, lance um erro
            throw new Error("Formato inválido para categories");
          }

          const categoryInstances = await Category.findAll({
            where: { id: categoryIds },
          });
          await article.setCategories(categoryInstances);
        }

        res.status(200).json({ message: "Article updated successfully" });
      } else {
        res.status(404).json({ error: "Article not found" });
      }
    } catch (error) {
      console.error("Error updating article:", error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the article." });
    }
  }
);

router.get("/articles/:id", async (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID in /articles/:id" });
  }

  try {
    const article = await Article.findByPk(id, {
      include: [{ model: Category }],
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);
  } catch (err) {
    console.error("Error fetching article:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/articles/:id/related", async (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    let relatedArticle;

    if (article.relatedArticleId) {
      relatedArticle = await Article.findByPk(article.relatedArticleId);
    } else {
      relatedArticle = await Article.findOne({
        where: { relatedArticleId: id },
      });
    }

    if (!relatedArticle) {
      return res.status(404).json({ error: "Related article not found" });
    }

    res.json({ relatedArticleId: relatedArticle.id });
  } catch (err) {
    console.error("Error fetching related article:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/articles/page/:num", (req, res) => {
  var limit = 4;
  var page = req.params.num;
  var offset;

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  offset = (parseInt(page) - 1) * limit;

  Article.findAndCountAll({
    limit: limit,
    offset: offset,
    order: [["id", "DESC"]],
  })
    .then((articles) => {
      var next = offset + limit < articles.count;
      var result = {
        page: parseInt(page),
        next: next,
        articles: articles,
      };

      Category.findAll()
        .then((categories) => {
          res.json({ result: result, categories: categories });
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
