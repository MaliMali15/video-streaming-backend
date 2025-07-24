
// promise resolve and reject type of asyncHandler
const asyncHandler=(requestHandler)=>async()=>{
    return (req,res,next)=>{
                Promise.resolve(requestHandler(req,res,next))
                .catch((err)=>next(err))
            }
}



// try and catch type of asyncHandler
// const asyncHandler=(requestHandler)=>async(req,res,next)=>{
//     try {
//         await requestHandler(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 400).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

export default asyncHandler

