const router = require("express").Router();
const { createMessage, getMessages, getConversations } = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/:receiverId", authMiddleware, createMessage);
router.get("/conversations", authMiddleware, getConversations);
router.get("/:receiverId", authMiddleware, getMessages);

module.exports = router;