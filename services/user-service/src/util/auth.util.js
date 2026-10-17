import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

const generateAccessToken = (userId) => {
    const payLoad = {
        userId,
        type: "access",
    };

    return jwt.sign(payLoad, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        {
            userId,
            type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        },
    );
};

const verifyAccesstoken = async (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshtoken = async (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export {
    comparePassword,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccesstoken,
    verifyRefreshtoken,
};
