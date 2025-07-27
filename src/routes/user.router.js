import { Router } from "express";
import { userRegister,userLogin,userLogout,tokenRefresher,changePassword,getCurrentUser,updateAccountDetails,updateAvatar,updateCoverImage } from "../controllers/user.controller.js";
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


// these are secure/protected routes because they are on the endpoints where user is logged in.
router.route("/logout").post(jwtVerify,userLogout)
router.route("/token-refresh").post(tokenRefresher)
router.route("/change-password").post(jwtVerify,changePassword)
router.route("/current-user").post(jwtVerify,getCurrentUser)
router.route("/update-details").post(jwtVerify,updateAccountDetails)
router.route("/update-avatar").post(jwtVerify,upload.single("avatar"),updateAvatar)
router.route("/update-coverimage").post(jwtVerify,upload.single("coverImage"),updateCoverImage)

export {router}