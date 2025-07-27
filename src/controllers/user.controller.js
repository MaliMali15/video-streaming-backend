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

const userLogin=asyncHandler( async (req , res) => {
    const{username,email,password}=req.body

    if(!username || !email){
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

    const generateAccessandRefreshToken=async (userId) => {
        try {

            const user=await User.findById(userId)
            const accessToken=user.generateAccessToken()
            const refreshToken=user.generateRefreshToken()
    
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave:false})
    
            return {accessToken,refreshToken}

        } catch (error) {

            throw new ApiError(500,"Some problem occurred while generating Access and Refresh tokens")

        }
    }

    const {accessToken,refreshToken}=generateAccessandRefreshToken(user._id)

    const loggedInUser=User.findOne({refreshToken}).select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User successfully logged In"
    ))
})

const userLogout=asyncHandler( async (req , res) => {

    const options={
        httpOnly: true,
        secure: true
    }

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

    res.status(200)
    .clearcookie("accessToken",options)
    .cookie("refreshToken",options)
    .json(new ApiResponse(
        200
        ,{}
        ,"User logged out"
        )
    )
})

export {userRegister,userLogin,userLogout}