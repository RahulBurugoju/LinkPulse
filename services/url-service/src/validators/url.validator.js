import { z } from "zod";

const createUrlSchema = z.object({
    originalUrl: z
        .string()
        .trim()
        .max(2048)
        .url()
        .refine((value) => {
            try {
                const parsed = new URL(value);

                return (
                    parsed.protocol === "http:" ||
                    parsed.protocol === "https:"
                );
            } catch {
                return false;
            }
        }, "Only HTTP and HTTPS URLs are allowed"),
});

    export {createUrlSchema}