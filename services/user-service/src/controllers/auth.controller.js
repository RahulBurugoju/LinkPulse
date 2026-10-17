import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import authServices from "../services/auth.service.js"

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
}

const registerController = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    const { user, accessToken, refreshToken } = await authServices.register({ name, email, password })

    res.cookie("accessToken", accessToken, cookieOptions)
    res.cookie("refreshToken", refreshToken, cookieOptions)

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user }, "User registered successfully"));
});

const loginController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await authServices.login({ email, password })

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user }, "User logged in successfully"));
});

const logoutController = asyncHandler(async (req, res) => {
    const userId = req?.user?.Id;

    const response = await authServices.logout(userId);
    if(!response.success){
        throw new ApiError(400,"logout failed")
    }
    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, response, "User logged out successfully"));
});

const getMeController = asyncHandler(async (req, res) => {
    const userId = req?.user?.Id
    const {user} = await authServices.getCurrentUser(userId);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));

});

const refreshTokensController = asyncHandler(async (req, res) => {
    const userRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken;
    if(!userRefreshToken){
        throw new ApiError(400,"refresh token required")
    }
    const {accessToken,refreshToken} = await authServices.refreshAccessToken(userRefreshToken)
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken }, "Tokens refreshed successfully"));
});



export { registerController, loginController, logoutController, getMeController, refreshTokensController }