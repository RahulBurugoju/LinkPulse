import { z } from "zod";

const registerSchema = z.object({
    name: z
        .string({ message: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name must not exceed 80 characters"),

    email: z
        .string({ message: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string({ message: "Password is required" })
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});


const loginSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string({ message: "Password is required" })
        .min(1, "Password is required"),
});

/**
 * Higher-order middleware to validate request body against a Zod schema.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    req.body = result.data;
    next();
};

const validateRegister = validate(registerSchema);
const validateLogin = validate(loginSchema);

export {
    registerSchema,
    loginSchema,
    validate,
    validateRegister,
    validateLogin,
};
