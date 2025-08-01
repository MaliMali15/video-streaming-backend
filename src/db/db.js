import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB=async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDb connected. DB Host:${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Database connection error",error)
        process.exit(1)
        
    }
}

export default connectDB