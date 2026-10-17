import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import User from "../models/user.model.js";
import {verifyAccesstoken} from "../util/auth.util.js";

export const authenticate = asyncHandler(async(req,res,next)=>{
    const authHeader = req.headers.authorization;
    const accessToken = req.cookies.accessToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);   
    
    if(!accessToken){
        throw new ApiError(401,"Unauthorized request : accesstoken required")
    }

    const decodedToken = await verifyAccesstoken(accessToken)

    if(decodedToken.type !== "access"){
        throw new ApiError(401,"Invalid access token : token type is not access")
    }

    const user = await User.findById(decodedToken?.userId).select("+refreshToken")
    
    if(!user || !user.refreshToken ){
        throw new ApiError(401,"Invalid access token")
    }

    req.user = {
        Id:user._id,
        name:user.name,
        email:user.email,
    }
    next()
})