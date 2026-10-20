import "./config/env.js";
import { connectDatabase } from "./config/db.js";
import ClickEvent from "./models/click-event.model.js";
import { consumer } from "./config/kafka.js";
import logger from "./config/logger.js";

async function startConsumer() {
    await consumer.connect();

    await consumer.subscribe({
        topic: "linkpulse.clicks",
        fromBeginning: true,
    });

    logger.info("Analytics consumer is listening for click events");

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;

            try {
                const event = JSON.parse(message.value.toString());

                if (
                    typeof event.eventId !== "string" ||
                    typeof event.shortCode !== "string" ||
                    typeof event.timestamp !== "string" ||
                    Number.isNaN(Date.parse(event.timestamp))
                ) {
                    logger.warn({ eventId: event?.eventId }, "Invalid click event received");
                    return;
                }

                await ClickEvent.updateOne(
                    { eventId: event.eventId },
                    {
                        $setOnInsert: {
                            eventId: event.eventId,
                            shortCode: event.shortCode,
                            timestamp: new Date(event.timestamp),
                            referrer: event.referrer ?? null,
                            userAgent: event.userAgent ?? null,
                        },
                    },
                    { upsert: true }
                );

                logger.info({ eventId: event.eventId, shortCode: event.shortCode }, "Click event persisted");
            } catch (error) {
                logger.error({ err: error.message }, "Failed to persist click event");

                // Rethrow database errors so KafkaJS can report processing failure.
                // We will add explicit retry/recovery handling in a later hardening step.
                throw error;
            }
        },
    });
}

async function main() {
    await connectDatabase();

    // Keep your existing startConsumer function and Kafka consumer setup.
    await startConsumer();
}

main().catch((error) => {
    logger.error({ err: error }, "Analytics Service failed to start");
    process.exitCode = 1;
});