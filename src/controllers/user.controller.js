import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import cloudinaryUpload from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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

const tokenRefresher=asyncHandler( async (req , res)=>{
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

export {userRegister,userLogin,userLogout,tokenRefresher}