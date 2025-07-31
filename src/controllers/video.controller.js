import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinaryUpload from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy="views", sortType="desc"} = req.query
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 20);
    
    if (!query) {
        throw new ApiError(400,"Need valid query to fetch relevant results")
    }

    const queryStr = query.trim()

    if (!queryStr) {
        throw new ApiError(400,"Need valid query to fetch relevant results")
    }
    
    if (sortBy !== "views" && sortBy !== "createdAt") {
        throw new ApiError(400,"Invalid sort reference")
    }

    if (sortType !== "asc" && sortType !== "desc") {
        throw new ApiError(400, "Invalid sort type")
    }

    let sortDirection
    if (sortType == "asc") {
        sortDirection=1
    } else {
        sortDirection=-1
    }

    const options= {
        page: pageNum,
        limit:limitNum
    }

    const videos = Video.aggregate([
        {
            $match: {
                $text: {
                    $search: queryStr
                }
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
        },
        {
            $sort: {
                [sortBy]:sortDirection
            }
        }
    ])

    const aggregateVideos=await Video.aggregatePaginate(videos,options)
    
    return res.status(200).json(new ApiResponse(
        200,
        aggregateVideos,
        "Videos fetched successfully"
    ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "username avatar coverImage"
    });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const toggleVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished:!video.isPublished
            }
        },
        {
            new: true
        }
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            toggleVideo,
            `Video is now ${toggleVideo.isPublished?"published":"unpublished"}`
        )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const userId=req.user?._id
    
    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400,"Missing credentials")
    }
    
    const videoFile = req.files?.videoFile
    const thumbnailFile=req.files?.thumbnail

    if (!videoFile) {
        throw new ApiError(400,"videoFile not found")
    }

    if (!thumbnailFile) {
        throw new ApiError(401,"thumbnailFile not found")
    }

    const video = await cloudinaryUpload(videoFile[0].path)
    const thumbnail=await cloudinaryUpload(thumbnailFile[0].path)

    if (!video) {
        throw new ApiError(401,"Some poblem occurred while uploading video")
    }

    if (!thumbnail) {
        throw new ApiError(401,"Some poblem occurred while uploading thumbnail")
    }


    const publishedVideo = await Video.create({
        videoFile: video.url || "",
        thumbnail: thumbnail.url || "",
        title: title.trim(),
        description: description.trim(),
        duration: video.duration || 0,
        owner:userId
    })

    return res.status(200).json(new ApiResponse(
        200,
        publishedVideo,
        "Video successfully published"
    ))


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    
    if (!videoId) {
        throw new ApiError(400,"Invalid Video Id")
    }

    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400,"Atleast one field needed to update video  info")
    }

    const updatedData = {}

    if (title?.trim()) {
        updatedData.title=title.trim()
    }

    if (description?.trim()) {
        updatedData.description=description.trim()
    }
    
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            ...updatedData
        },
        {
            new: true
        }
    )

    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video info updated successfully"
    ))
})

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const newThumbnailPath = req.file?.path
    
    if (!videoId) {
        throw new ApiError(400, "Invalid video Id")
    }

    if (!newThumbnailPath) {
        throw new ApiError(400,"File not found")
    }

    const newThumbnail = await cloudinaryUpload(newThumbnailPath)
    
    const newVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            thumbnail:newThumbnail.url
        },
        {
            new :true
        }
    )

    return res.status(200).json(new ApiResponse(
        200,
        newVideo,
        "Video thumbnail successfully updated"

    ))
})

export {
    getAllVideos,
    getVideoById,
    deleteVideo,
    togglePublishStatus,
    publishAVideo,
    updateVideo,
    updateThumbnail


}