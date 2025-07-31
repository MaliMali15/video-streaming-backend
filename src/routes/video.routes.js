import { Router } from "express";
import { getAllVideos, getVideoById, deleteVideo, togglePublishStatus, publishAVideo, updateVideo, updateThumbnail } from "../controllers/video.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(jwtVerify)

router.route("/allVideos").get(getAllVideos)
router.route("/v/:videoId").get(getVideoById).delete(deleteVideo).post(togglePublishStatus).patch(updateVideo)
router.route("/publish").post(publishAVideo)
router.route("/change-thumbnail").patch(updateThumbnail)





export default router