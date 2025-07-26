import dotenv from "dotenv"
import connectDB from "./db/db.js"
import app from "./app.js"



dotenv.config({
    path: "./.env"
})

connectDB()
.then((result) => {
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server listening on ${process.env.PORT}`);
    })
}).catch((err) => {
    console.log("Mongo connection Error:", err);
    
});