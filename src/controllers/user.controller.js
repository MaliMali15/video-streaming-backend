import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import cloudinaryUpload from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessandRefreshToken=async (userId) => {
        try {

            const user=await User.findById(userId)
            const accessToken= user.generateAccessToken()
            const refreshToken= user.generateRefreshToken()
    
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave:false})
    
            return {accessToken,refreshToken}

        } catch (error) {

            throw new ApiError(500,"Some problem occurred while generating Access and Refresh tokens")

        }
    }

const options={
    httpOnly: true,
    secure: true
}


const userRegister=asyncHandler( async (req , res) => {
    const{username,email,fullName,password}=req.body
    // if(username==="" || email==="" || fullName==="" || password===""){
    //     throw new ApiError(409,"All fields are required")
    // }

    //smarter syntax
    if([username,email,fullName,password].some((field)=>field?.trim()==="")){
        throw new ApiError(409,"All fields are required")
    }

    // check if user exists
    if(await User.findOne({$or:[{email},{username}]})){
        throw new ApiError(400,"User already exists")
    }

    const avatarPath=req.files?.avatar[0]?.path
    let coverImagePath;
    const coverimage=req.files?.coverImage

    if(!avatarPath){
        throw new ApiError(400,"Avatar is required")
    }

    if(coverimage){
        coverImagePath=coverimage[0].path
    }

    const avatar=await cloudinaryUpload(avatarPath)
    const coverImage=await cloudinaryUpload(coverImagePath)

    if(!avatar){
        throw new ApiError("Avatar is required")
    }

    const user = await User.create({
        username:username.toLowerCase(),
        fullName,
        password,
        email,
        avatar:avatar.url,
        coverImage:coverImage?coverImage.url: ""
    })

    const createdUser=await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"User wasnt registered due to some server side problem")
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const userLogin=asyncHandler( async (req , res) => {
    const{username,email,password}=req.body

    if(!username && !email){
        throw new ApiError(400,"Missing credentials")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User doesnt exist")
    }

    const isPassCorrect=await user.isPassCorrect(password)

    if(!isPassCorrect){
        throw new ApiError(400,"Invalid credentials")
    }

    const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)

    const loggedInUser=await User.findOne({refreshToken}).select("-password -refreshToken")

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            accessToken,
            refreshToken
        },
        "User successfully logged In"
    ))
})

const userLogout=asyncHandler( async (req , res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
        200
        ,{}
        ,"User logged out"
        )
    )
})

const tokenRefresher=asyncHandler( async (req , res) => {
    const token=req.cookies.refreshToken || req.body.refreshToken

    if(!token){
        throw new ApiError(401,"Invalid incoming token")
    }

    const decodedToken=jwt.verify(token,process.env.REFRESH_TOKEN_SECRET_KEY)

    if(!decodedToken){
        throw new ApiError(401,"Invalid token")
    }

    const user=await User.findById(decodedToken._id)

    if(!user){
        throw new ApiError(401,"Invalid token")
    }

    if(token!==user.refreshToken){
        throw new ApiError(401,"Refresh Token expired")
    }

    const{accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            accessToken,
            refreshToken
        },
        "Tokens succesfully refreshed"
    ))


})

const changePassword= asyncHandler( async( req , res) => {
    const {oldPassword,newPassword}= req.body
    const user=await User.findById(req.user._id)
    
    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Invalid Request")
    }

    const isOldPassCorrect=await user.isPassCorrect(oldPassword)

    if(!isOldPassCorrect){
        throw new ApiError(400,"Incorrect password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(
        200,{},"Password changed successfully"
    ))

})

const getCurrentUser= asyncHandler( async(req, res)=>{
    const user=req.user

    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            user:user
        },
        "Current user retrieved succesfully"
    ))
})

const updateAccountDetails=asyncHandler( async (req , res)=>{

    const {username,fullName}=req.body
    const updatedData={}

    if(!username && !fullName){
        throw new ApiError(401,"Data invalid or missing")
    }

    if(username){
        updatedData.username=username
    }

    if(fullName){
        updatedData.fullName=fullName
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                ...updatedData
            }
        },
        {
            new: true
        }

    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse
        (
            200,
            {
                user
            },
            "User Updated succesfully"
        )
    )

})

const updateAvatar=asyncHandler( async (req , res) => {
    const avatarPath=req.file.path

    if(!avatarPath){
        throw new ApiError(400,"File not found")
    }

    const avatarImage=await cloudinaryUpload(avatarPath)

    if(!avatarImage){
        throw new ApiError(404,"Some issue occurred while uploading avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatarImage.url
            }
        },
        {
            new :true
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(
            200,
            {
                user
            },
            "Avatar updated successfully"
        )
    )



})

const updateCoverImage=asyncHandler( async (req , res) => {
    const coverImagePath=req.file.path

    if(!coverImagePath){
        throw new ApiError(400,"File not found")
    }

    const coverImage=await cloudinaryUpload(coverImagePath)

    if(!coverImage){
        throw new ApiError(404,"Some issue occurred while uploading coverImage")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new :true
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            user
        },
        "coverImage updated successfully"
    ))
})

const getChannelInfo=asyncHandler( async(req , res)=>{
    const {username}=req.params

    if(!username){
        throw new ApiError(404,"User doesnt exist")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username
            }
        },

        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscribedTo",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"channelsSubscribed"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedCount:{
                    $size:"$channelsSubscribed"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                    
                }
            }    
        },
        {
            $project:{
                username:1,
                avatar:1,
                coverImage:1,
                createdAt:1,
                updatedAt:1
            }
        }
    ])

    if(!channel.length){
        throw new ApiError(404,"Channel doesnt exist")
    }
        
    console.log(channel);

    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel retrieved successfully"
    ))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchedVideos",
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
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,user[0].watchedVideos,"Watch history fetched successfully")
    )
})

// getWatchHistory using populate (easier less code)
// Note: this will return an array of video documents corresponding to the videoIds
// stored in the watchHistory field of user(which is defined as an array in the user schema)
// doesnt work when video schema doesnt exist (the videoschema whose id is stored in watch history for populate to populate the field)
// contrary to this using lookup works even if there is no video schema it just returns an empty array

// const getWatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user?._id)
//         .populate({
//             path: "watchHistory",
//             populate: {
//                 path: "owner",
//                 select:" username avatar coverImage"
//             }
//         }) 
//     return res.status(200).json(
//         new ApiResponse(
//             200,
//             user.watchHistory,
//             "Watch history fetched successfully"
//         )
//     )
// })


export {
    userRegister,
    userLogin,
    userLogout,
    tokenRefresher,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelInfo,
    getWatchHistory
}