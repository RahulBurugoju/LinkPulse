import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import authServices from "../services/auth.service.js"

const registerController = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, { message: "User registered successfully" }));
});

const loginController = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, { message: "User logged in successfully" }));
});

const logoutController = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, { message: "User logged out successfully" }));
});

const getMeController = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { message: "User fetched successfully" }));

});

const refreshTokensController = asyncHandler(async(req,res)=>{
    return res
        .status(200)
        .json(new ApiResponse(200, { message: "Tokens refreshed successfully" }));
});

// const changePasswordController = asyncHandler(async(req,res)=>{
//     return res
//         .status(200)
//         .json(new ApiResponse(200, { message: "Password changed successfully" }));
// });

export { registerController, loginController, logoutController, getMeController, refreshTokensController }