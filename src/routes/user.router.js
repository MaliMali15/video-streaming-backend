import { Router } from "express";
import { userRegister,userLogin,userLogout,tokenRefresher } from "../controllers/user.controller.js";
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


// these are secure/protected routes because on the endpoints user is logged in.
router.route("/logout").post(jwtVerify,userLogout)
router.route("/token-refresh").post(tokenRefresher)

export {router}