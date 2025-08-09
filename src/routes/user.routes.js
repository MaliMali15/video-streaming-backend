import { Router } from "express";
import { userRegister,userLogin,userLogout,tokenRefresher,changePassword,getCurrentUser,updateAccountDetails,updateAvatar,updateCoverImage, getChannelInfo, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router= Router()

router.route("/register").post(upload.fields(
    [
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),userRegister)

router.route("/login").post(userLogin)


// these are secure/protected routes because they are on the endpoints where user is logged in/need verification/authentication.
router.route("/logout").post(jwtVerify,userLogout)
router.route("/token-refresh").post(tokenRefresher)
router.route("/change-password").post(jwtVerify,changePassword)
router.route("/current-user").get(jwtVerify,getCurrentUser)
router.route("/update-details").patch(jwtVerify,updateAccountDetails)
router.route("/update-avatar").patch(jwtVerify,upload.single("avatar"),updateAvatar)
router.route("/update-coverimage").patch(jwtVerify, upload.single("coverImage"), updateCoverImage)
router.route("/channel/:username").get(jwtVerify,getChannelInfo)
router.route("/history").get(jwtVerify,getWatchHistory)
export default router