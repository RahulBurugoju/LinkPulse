import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { ApiError } from "../util/ApiError.js";
import authServices from "../services/auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerController = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const { user, accessToken, refreshToken } = await authServices.register({ name, email, password });

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully"));
});

const loginController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await authServices.login({ email, password });

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutController = asyncHandler(async (req, res) => {
    const userId = req?.user?.Id;

    const response = await authServices.logout(userId);
    if (!response.success) {
        throw new ApiError(400, "logout failed");
    }
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, response, "User logged out successfully"));
});

const getMeController = asyncHandler(async (req, res) => {
    const userId = req?.user?.Id;
    const { user } = await authServices.getCurrentUser(userId);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
});

const refreshTokensController = asyncHandler(async (req, res) => {
    let userRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken;
    if (!userRefreshToken) {
        throw new ApiError(400, "refresh token required");
    }

    if (typeof userRefreshToken === "string" && userRefreshToken.startsWith("Bearer ")) {
        userRefreshToken = userRefreshToken.slice(7).trim();
    }

    const { accessToken, refreshToken } = await authServices.refreshAccessToken(userRefreshToken);
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Tokens refreshed successfully"));
});

export { registerController, loginController, logoutController, getMeController, refreshTokensController };