const express = require("express");
const router = express.Router();
const User = require("./User");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");

const JWTSecret = process.env.JWT_SECRET;
router.post("/authenticate", (req, res) => {
  var emailOrUsername = req.body.emailOrUsername;
  var password = req.body.password;
  User.findOne({
    where: {
      [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }],
    },
  }).then((user) => {
    if (user != undefined) {
      var correct = bcrypt.compareSync(password, user.password);
      if (correct) {
        jwt.sign(
          {
            id: user.id,
            email: user.email,
            username: user.username,
          },
          JWTSecret,
          { expiresIn: "48h" },
          (err, token) => {
            if (err) {
              res.status(400).json({ err: "Falha interna" });
            } else {
              res.status(200).json({
                token: token,
                user: {
                  id: user.id,
                  email: user.email,
                  username: user.username,
                  type: user.type,
                },
              });
            }
          }
        );
      } else {
        res.status(401).json({ err: "Credenciais invalidas" });
      }
    } else {
      res.status(401).json({ err: "Credenciais invalidas" });
    }
  });
});

router.post("/users/create", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ err: "Todos os campos são obrigatórios" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ err: "Usuário ou email já existe" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
      type: "client",
    });

    const { password: _, ...userData } = newUser.toJSON();

    res
      .status(201)
      .json({ success: "Usuário criado com sucesso", user: userData });
  } catch (error) {
    res.status(500).json({ err: "Erro ao criar o usuário", error });
  }
});

router.put("/users/update-email", auth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ err: "O campo email é obrigatório." });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res
        .status(400)
        .json({ err: "O email já está em uso por outro usuário." });
    }

    await User.update({ email }, { where: { id: req.loggedUser.id } }); // Alterado para req.loggedUser.id
    res.status(200).json({ success: "Email atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ err: "Erro ao atualizar o email.", error });
  }
});

router.put("/users/update-username", auth, async (req, res) => {
  const { username } = req.body;
  console.log("username", username);
  if (!username) {
    return res.status(400).json({ err: "O campo username é obrigatório." });
  }

  try {
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      return res
        .status(400)
        .json({ err: "O nome de usuário já está em uso por outro usuário." });
    }

    await User.update(
      { username },
      { where: { id: req.loggedUser.id } } // Alterado para req.loggedUser.id
    );
    res
      .status(200)
      .json({ success: "Nome de usuário atualizado com sucesso." });
  } catch (error) {
    res
      .status(500)
      .json({ err: "Erro ao atualizar o nome de usuário.", error });
  }
});

router.put("/users/update-name", auth, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ err: "O campo name é obrigatório." });
  }

  try {
    await User.update(
      { name },
      { where: { id: req.loggedUser.id } } // Alterado para req.loggedUser.id
    );
    res.status(200).json({ success: "Nome atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ err: "Erro ao atualizar o nome.", error });
  }
});

router.put("/users/update-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log("atualizando senha");
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ err: "Os campos senha antiga e nova senha são obrigatórios." });
  }

  try {
    const user = await User.findByPk(req.loggedUser.id); // Alterado para req.loggedUser.id
    console.log("user", user);
    if (!user) {
      return res.status(404).json({ err: "Usuário não encontrado." });
    }

    const correct = bcrypt.compareSync(oldPassword, user.password);
    console.log("correct", correct);
    if (!correct) {
      return res.status(401).json({ err: "A senha antiga está incorreta." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.update(
      { password: hashedPassword },
      { where: { id: req.loggedUser.id } } // Alterado para req.loggedUser.id
    );
    res.status(200).json({ success: "Senha atualizada com sucesso." });
  } catch (error) {
    res.status(500).json({ err: "Erro ao atualizar a senha.", error });
  }
});

router.get("/users/me", auth, async (req, res) => {
  try {
    const userId = req.loggedUser.id;
    console.log("buscando dados do usuario", userId);
    const user = await User.findByPk(req.loggedUser.id, {
      attributes: ["id", "name", "username", "email", "type"],
    });

    if (!user) {
      return res.status(404).json({ err: "Usuário não encontrado." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: "Erro ao buscar os dados do usuário.", error });
  }
});

router.post("/users/validate-token", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, JWTSecret);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "username", "email", "type"],
    });

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    return res.status(200).json({ message: "Token válido", user });
  } catch (error) {
    console.error("Erro ao validar token:", error.message);
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
});

module.exports = router;
