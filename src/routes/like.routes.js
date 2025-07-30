import { Router } from "express";
import { getLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(jwtVerify)

router.route("/toggle/video/:videoId").post(toggleVideoLike)
router.route("/toggle/comment/:commentId").post(toggleCommentLike)
router.route("/likedVideos").get(getLikedVideos)

export default router