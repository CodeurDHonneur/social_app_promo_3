const router = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
    registerUser,
    loginUser,
    logoutUser,
    renewAccessToken,
    getUser,
    getUsers,
    editUser,
    followUnfollowerUser,
    changeUserAvatar
} = require("../controllers/user.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/renewAccessToken", renewAccessToken);
router.get("/all", getUsers);
router.get("/:id", getUser);
router.patch("/:id", authMiddleware, editUser);
router.patch("/:id/follow-unfollow", authMiddleware, followUnfollowerUser);
router.post("/avatar", authMiddleware, changeUserAvatar);


module.exports = router;