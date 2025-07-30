import { Router } from "express";
import { getSubscribedChannels, getChannelSubs, toggleSubscription } from "../controllers/subscription.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/channel/:channelId").post(jwtVerify, toggleSubscription)
router.route("/channel/:channelId").get(jwtVerify, getChannelSubs)
router.route("/user/:userId").get(jwtVerify, getSubscribedChannels)

export default router