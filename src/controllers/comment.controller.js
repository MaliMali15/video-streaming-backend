import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const { page = 1, limit = 10 } = req.query
    
    if (!videoId) {
        throw new ApiError(401,"Video doesnt exist")
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort:{
            createdAt:-1
        }
    }

    const comments = Comment.aggregate([
        {
            $match: {
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
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
    ])

    const paginatedComments= await Comment.aggregatePaginate(comments,options)

    return res.status(200).json(new ApiResponse(
        200,
        paginatedComments,
        "Comments successfully fetched"
    ))
})

const addComment = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { videoId } = req.params;
    const { content } = req.body;

    if (!userId || !videoId || !content.trim()) {
        throw new ApiError(400, "Missing required fields: user, videoId, or content");
    }

    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    return res.status(200).json(new ApiResponse(
        201,
        comment,
        "Comment added successfully"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !content?.trim()) {
        throw new ApiError(400, "Comment ID and new content are required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content:content
            }
        },
        {
            new: true
        }
    )

    return res.status(200).json(new ApiResponse(
        200,
        updatedComment,
        "Comment updated successfully"
    ));
});

const deleteComment = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Comment deleted successfully"
    ));
});

export {
    addComment,
    updateComment,
    getVideoComments,
    deleteComment
}