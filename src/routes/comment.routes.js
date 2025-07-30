import { Router } from "express";
import { addComment, getVideoComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(jwtVerify)

router.route("/:videoId").post(addComment).get(getVideoComments)
router.route("/comment/:commentId").patch(updateComment).delete(deleteComment)


export default router