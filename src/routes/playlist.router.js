import { Router } from "express";
import { createPlaylist, getUserPlaylistList, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, updatePlaylist ,deletePlaylist} from "../controllers/playlist.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(jwtVerify)

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(getUserPlaylistList)
router.route("/:playlistId")
    .get(getPlaylistById)
    .delete(deletePlaylist)
    .patch(updatePlaylist)

router.route("/addVideo/:playlistId/:videoId").patch(addVideoToPlaylist)
router.route("/removeVideo/:playlistId/:videoId").patch(removeVideoFromPlaylist)

export default router