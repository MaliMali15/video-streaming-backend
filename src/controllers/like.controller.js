import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!videoId || !userId) {
        throw new ApiError(400, "Missing videoId or user authentication");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        owner: userId
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(new ApiResponse(
            200,
            {},
            "Like removed from video"
        ));
    } else {
        const newLike = await Like.create({
            video: videoId,
            owner: userId
        });

        return res.status(200).json(new ApiResponse(
            200,
            newLike,
            "Video liked successfully"
        ));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!commentId || !userId) {
        throw new ApiError(400, "Missing commentId or user authentication");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        owner: userId
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(new ApiResponse(
            200,
            {},
            "Like removed from comment"
        ));
    } else {
        const newLike = await Like.create({
            comment: commentId,
            owner: userId
        });

        return res.status(200).json(new ApiResponse(
            200,
            newLike,
            "Comment liked successfully"
        ));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                video: { $ne: null } // Only include likes on videos, not comments
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoInfo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        coverImage:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$videoInfo"
        }
    ]);

    return res.status(200).json(new ApiResponse(
        200,
        likedVideos,
        "Fetched liked videos successfully"
    ));
});


export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
}