const express = require("express");
const router = express.Router();
const Category = require("../categories/Category");
const Article = require("./Article");
const slugify = require("slugify");
const auth = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const { Op, Sequelize } = require("sequelize");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use((req, res, next) => {
  console.log(`Request URL: ${req.originalUrl}`);
  next();
});

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    link: `http://localhost:8080/uploads/${req.file.filename}`,
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
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const { title, body, categories, summary, language, relatedArticleId } =
        req.body;
      const coverImage = req.file
        ? `http://localhost:8080/${req.file.path}`
        : null;

      if (!title || !body || !categories || !language) {
        return res.status(400).json({
          error: "Title, body, categories, and language are required",
        });
      }

      const articleData = {
        title: title,
        slug: slugify(title),
        body: body,
        summary: summary,
        coverImage: coverImage,
        language: language,
        relatedArticleId: relatedArticleId ? relatedArticleId : null,
      };

      const newArticle = await Article.create(articleData);

      const categoryIds = categories
        .split(",")
        .map((id) => parseInt(id.trim()));

      const categoryInstances = await Category.findAll({
        where: { id: categoryIds },
      });

      await newArticle.addCategories(categoryInstances);

      if (relatedArticleId) {
        const relatedArticle = await Article.findByPk(relatedArticleId);
        if (relatedArticle) {
          await relatedArticle.update({ relatedArticleId: newArticle.id });
        }
      }

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
  upload.single("coverImage"),
  async (req, res) => {
    console.log("update: ", req.body);
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
      const coverImage = req.file
        ? `http://localhost:8080/${req.file.path}`
        : req.body.coverImage;

      if (!id || !title || !body || !categories) {
        return res
          .status(400)
          .json({ error: "ID, title, body and categories are required" });
      }

      const updatedArticle = await Article.update(
        {
          title: title,
          slug: slugify(title),
          body: body,
          summary: summary,
          coverImage: coverImage,
          language: language,
          relatedArticleId: relatedArticleId || null,
        },
        { where: { id: id } }
      );

      if (updatedArticle[0] === 1) {
        const article = await Article.findByPk(id);
        if (categories && categories.length > 0) {
          const categoryIds = Array.isArray(categories)
            ? categories
            : [categories];
          const categoryInstances = await Category.findAll({
            where: { id: categoryIds.map(Number) },
          });
          await article.setCategories(categoryInstances);
        }
        res.status(200).json({ message: "Article updated successfully" });
      } else {
        res.status(404).json({ error: "Article not found" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while saving the article." });
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
