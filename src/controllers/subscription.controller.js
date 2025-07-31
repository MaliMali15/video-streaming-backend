import { Subscription } from "../models/subscription.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user?._id

    if (!channelId) {
        throw new ApiError(401,"Invalid channel id")
    }

    if (!userId) {
        throw new ApiError(401,"Invalid user")
    }
    
    const subDocument = await Subscription.findOne({
        subscriber: userId,
        subscribedTo: channelId
    })

    if (subDocument) {
        await Subscription.deleteOne({ _id: subDocument._id })
        return res.status(200).json(new ApiResponse(
            200,
            {},
            "Unsubscribed successfully"
        ))
    }

    const newSubDocument=await Subscription.create({
        subscriber: userId,
        subscribedTo:channelId
    })

    
    return res.status(200).json(new ApiResponse(
        200,
        newSubDocument,
        "Subscribed successfully"
    ))


})

const getChannelSubs = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(401,"Invalid id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                subscribedTo: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as:"subscribers"
            }
        },
        {
            $unwind:"$subscribers"
        },
        {
            $project: {
                username: "$subscribers.username",
                avatar: "$subscribers.avatar",
                coverImage:"$subscribers.coverImage"
            }
        }
        
    ])

    return res.status(200).json(new ApiResponse(
        200,
        subscribers,
        "Subscribers fetched successfully"
    ))
    

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(401,"Invalid username")
    }
    
    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscribedTo",
                foreignField: "_id",
                as: "channelsSubscribed"
            }
        },
        {
            $unwind:"$channelsSubscribed"
        },
        {
            $project: {
                username: "$channelsSubscribed.username",
                avatar: "$channelsSubscribed.avatar",
                coverImage:"$channelsSubscribed.coverImage"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        channelList,
        "Fetched channels user is subscribed to successfully"
    ))
})

export{toggleSubscription,getChannelSubs,getSubscribedChannels}