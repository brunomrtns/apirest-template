const express = require("express");
const router = express.Router();
const Category = require("./Category");
const Article = require("../articles/Article");
const slugify = require("slugify");
const auth = require("../middlewares/auth");

router.get("/admin/categories", (req, res) => {
	Category.findAll({ order: [["id", "DESC"]] })
		.then((categories) => {
			res.json(categories);
		})
		.catch((err) => {
			res.status(500).json({ error: err.message });
		});
});

router.post("/categories/save", auth, (req, res) => {
	const { title } = req.body;
	if (title) {
		Category.create({
			title: title,
			slug: slugify(title),
		})
			.then((category) => {
				res.status(201).json({ id: category.id, title: category.title });
			})
			.catch((err) => {
				res.status(500).json({ error: err.message });
			});
	} else {
		res.status(400).json({ error: "Title is required" });
	}
});

router.post("/categories/delete", auth, (req, res) => {
	var id = req.body.id;
	if (id !== undefined && !isNaN(id)) {
		Category.destroy({
			where: {
				id: id,
			},
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

router.get("/admin/categories/edit/:id", auth, (req, res) => {
	var id = req.params.id;
	if (isNaN(id)) {
		res.status(400).json({ error: "Invalid ID" });
	} else {
		Category.findByPk(id)
			.then((category) => {
				if (category != undefined) {
					res.json(category);
				} else {
					res.status(404).json({ error: "Category not found" });
				}
			})
			.catch((err) => {
				res.status(500).json({ error: err.message });
			});
	}
});

router.post("/categories/update", auth, (req, res) => {
	var { id, title } = req.body;
	Category.update({ title: title, slug: slugify(title) }, { where: { id: id } })
		.then(([rowsUpdate]) => {
			if (rowsUpdate === 1) {
				res.status(200).json({ message: "Category updated successfully" });
			} else {
				res.status(404).json({ error: "Category not found" });
			}
		})
		.catch((err) => {
			res.status(500).json({ error: err.message });
		});
});

router.get("/categories", (req, res) => {
	Category.findAll({ order: [["id", "DESC"]] })
		.then((categories) => {
			res.json(categories);
		})
		.catch((err) => {
			res.status(500).json({ error: err.message });
		});
});

router.get("/categories/:categoryId/articles/:language", (req, res) => {
	const { categoryId, language } = req.params;

	Article.findAll({
		include: [
			{
				model: Category,
				where: { id: categoryId },
			},
		],
		where: {
			language: language,
		},
		order: [["id", "DESC"]],
	})
		.then((articles) => {
			res.json(articles);
		})
		.catch((err) => {
			res.status(500).json({ error: err.message });
		});
});

module.exports = router;
