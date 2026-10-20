const SHORT_CODE_REGEX = /^[a-zA-Z0-9]{8}$/;

export const validateShortCode = (shortCode) => {
    return typeof shortCode === "string" && SHORT_CODE_REGEX.test(shortCode);
};
