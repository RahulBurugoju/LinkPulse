import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

const JWT_ISSUER = process.env.JWT_ISSUER || "linkpulse";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "linkpulse-users";

const generateAccessToken = (userId) => {
    const payLoad = {
        userId,
        type: "access",
    };

    return jwt.sign(payLoad, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
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
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        },
    );
};

const verifyAccesstoken = async (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

const verifyRefreshtoken = async (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
};

export {
    comparePassword,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccesstoken,
    verifyRefreshtoken,
};
