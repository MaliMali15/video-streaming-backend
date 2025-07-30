import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"

app.use("/user", userRouter)
app.use("/subscriptions", subscriptionRouter)
app.use("/playlist", playlistRouter)
app.use("/likes", likeRouter)
app.use("/comments",commentRouter)

export default app
