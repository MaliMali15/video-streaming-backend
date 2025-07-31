import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const userId = req.user?._id
    if (!name && !description) {
        throw new ApiError(400, "Missing credentials")
    }

    const playlistInfo = {}

    if (name) {
        playlistInfo.name=name
    }

    if (description) {
        playlistInfo.description=description
    }

    if (userId){
        playlistInfo.owner=userId
    }

    const playlist=await Playlist.create({
        ...playlistInfo
    })

    return res.status(200).json(new ApiResponse(
        200,
        playlist,
        "Playlist created"
    ))


})

const getUserPlaylistList = asyncHandler(async (req, res) => {
    const { userId } = req.params
    
    if (!userId) {
        throw new ApiError("Invalid User")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
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
                                $first:"$owners"
                            }
                            
                        }
                    }
                ]
            }
        },
    
    ])

    return res.status(200).json(new ApiResponse(
        200,
        playlists,
        "Playlists fetched"
    ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId) {
        throw new ApiError(404,"Invalid playlistId")
    }
    
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
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
                                $first:"$owners"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        playlist[0],
        "Playlist Fetched"
    ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(401,"Missing Id's of documents")
    }

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(
        200,
        playlist,
        "Video added to playlist"
    ))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!playlistId || !videoId) {
        throw new ApiError(401,"Missing Id's of documents")
    }

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    return res.status(200).json(new ApiResponse(
        200,
        playlist,
        "Video removed from playlist"
    ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId) {
        throw new ApiError(401,"Invalid playlistId")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Playlist successfully deleted"
    ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!playlistId) {
        throw new ApiError(401,"Invalid playlistId")
    }

    const updatedData = {}
    
    if (!name && !description) {
        throw new ApiError(401,"Insufficient information to update playlist")
    }

    if (name) {
        updatedData.name=name
    }

    if (description) {
        updatedData.description=description
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                ...updatedData
            }
        },
        {
            new:true
        }
    ).select("-videos -owner")

    return res.status(200).json(new ApiResponse(
        200,
        updatedPlaylist,
        "playlist Updated successfully"
    ))
})


export {createPlaylist,getUserPlaylistList,getPlaylistById,addVideoToPlaylist,removeVideoFromPlaylist,updatePlaylist,deletePlaylist}

