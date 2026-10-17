import User from "../models/user.model.js";
import { ApiError } from "../util/ApiError.js";

import {
    comparePassword,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccesstoken,
    verifyRefreshtoken,
} from '../util/auth.util.js'


const register = async ({ name, email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
    });

    const accessToken = generateAccessToken(user?._id.toString());
    const refreshToken = generateRefreshToken(user?._id.toString());

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return {
        user: {
            Id: user._id,
            name: user.name,
            email: user.email,
        },
        accessToken,
        refreshToken,
    };
}

const login = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({
        email: normalizedEmail,
    }).select("+password +refreshToken");

    if (!userExists) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordMatch = await comparePassword(password, userExists?.password);

    if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(userExists?._id.toString());
    const refreshToken = generateRefreshToken(userExists?._id.toString());

    userExists.refreshToken = refreshToken;

    await userExists.save({ validateBeforeSave: true });

    return {
        user: {
            Id: userExists._id,
            name: userExists.name,
            email: userExists.email,
        },
        accessToken,
        refreshToken,
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    const decodedToken = await verifyRefreshtoken(refreshToken);

    if (decodedToken.type !== "refresh") {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken?.userId).select(
        "+refreshToken",
    );

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = newRefreshToken;

    await user.save({ validateBeforeSave: false });

    const newAccessToken = generateAccessToken(user._id.toString());

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

const logout = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId).select("+refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.refreshToken = null;

    await user.save({ validateBeforeSave: false });

    return {
        success: true,
        message: "User logged out successfully",
    };
};

const getCurrentUser = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return {
        user: {
            Id: user._id,
            name: user.name,
            email: user.email,
        },
    };
};

export default {
    register,
    login,
    refreshAccessToken,
    logout,
    getCurrentUser,
}
