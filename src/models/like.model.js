import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment" 
        
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

export const Like=mongoose.model("Like",likeSchema)