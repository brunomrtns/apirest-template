const express = require("express");
const router = express.Router();
const Chat = require("./Chat");
const Message = require("./Message");
const User = require("../users/User");
const auth = require("../middlewares/auth");
const sendEmail = require("../email/mailer");

const emailTimestamps = new Map();

module.exports = (io, onlineUsers) => {
	router.post("/chat/create", auth, (req, res) => {
		const { name, attendantId, clientId } = req.body;

		if (!name || !attendantId || !clientId) {
			return res
				.status(400)
				.json({ err: "name, attendantId e clientId são obrigatórios" });
		}

		Chat.create({ name, attendantId, clientId })
			.then((chat) => {
				io.emit("newChat", chat);
				res.status(201).json({ success: "Chat criado com sucesso", chat });
			})
			.catch((error) => {
				res.status(500).json({ err: "Erro ao criar o chat", error });
			});
	});

	router.post("/messages", auth, async (req, res) => {
		const { chatId, content } = req.body;
		const userId = req.loggedUser.id;

		if (!chatId || !content) {
			return res.status(400).json({ err: "chatId e content são obrigatórios" });
		}

		try {
			const message = await Message.create({ chatId, userId, content });

			io.to(chatId).emit("message", message);

			const chat = await Chat.findByPk(chatId);

			if (chat) {
				const recipientId =
					chat.attendantId === userId ? chat.clientId : chat.attendantId;

				const recipient = await User.findByPk(recipientId);
				if (recipient) {
					const recipientEmail = recipient.email;
					const currentTime = Date.now();
					const lastEmailTime = emailTimestamps.get(recipientId) || 0;
					const timeDifference = currentTime - lastEmailTime;

					if (
						!onlineUsers.has(recipientId) &&
						timeDifference > 20 * 60 * 1000
					) {
						const subject = "Nova Mensagem Recebida";
						const text = `Você recebeu uma nova mensagem: ${content}`;
						sendEmail(recipientEmail, subject, text);
						emailTimestamps.set(recipientId, currentTime);
					}
				}

				io.to(`user_${recipientId}`).emit("notification", { chatId, message });
			}

			res
				.status(201)
				.json({ success: "Mensagem enviada com sucesso", message });
		} catch (error) {
			res.status(500).json({ err: "Erro ao enviar a mensagem", error });
		}
	});

	router.put("/messages/:id/read", auth, async (req, res) => {
		const { id } = req.params;
		const userId = req.loggedUser.id;

		try {
			const message = await Message.findByPk(id);

			if (message && message.userId !== userId) {
				await message.update({ isRead: true });
				res.status(200).json({ success: "Mensagem marcada como lida" });
			} else {
				res
					.status(404)
					.json({ err: "Mensagem não encontrada ou não autorizada" });
			}
		} catch (error) {
			res.status(500).json({ err: "Erro ao atualizar a mensagem", error });
		}
	});

	router.get("/chat/:clientId", auth, async (req, res) => {
		const { clientId } = req.params;

		try {
			const chat = await Chat.findOne({ where: { clientId } });
			if (chat) {
				res.status(200).json({ chat });
			} else {
				res.status(404).json({ err: "Chat não encontrado" });
			}
		} catch (error) {
			res.status(500).json({ err: "Erro ao buscar o chat", error });
		}
	});

	router.get("/chat/:chatId/messages", auth, async (req, res) => {
		const { chatId } = req.params;

		try {
			const messages = await Message.findAll({ where: { chatId } });
			res.status(200).json(messages);
		} catch (error) {
			res.status(500).json({ err: "Erro ao buscar as mensagens", error });
		}
	});

	router.get("/chats", auth, async (req, res) => {
		try {
			const chats = await Chat.findAll();
			res.status(200).json(chats);
		} catch (error) {
			res.status(500).json({ err: "Erro ao buscar os chats", error });
		}
	});

	return router;
};
