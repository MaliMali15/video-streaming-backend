import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import cloudinaryUpload from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    res.status(200).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

export {userRegister}