const router = require("express").Router();
const {createComment, getPostComments, deleteComment} = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth.middleware");


router.post("/:postId", authMiddleware, createComment);
router.get("/:postId", authMiddleware, getPostComments);
router.delete("/:commentId", authMiddleware, deleteComment);

module.exports = router;