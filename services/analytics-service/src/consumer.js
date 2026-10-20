import "dotenv/config";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "linkpulse-analytics-service",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092")
        .split(",")
        .map((broker) => broker.trim()),
    retry: {
        retries: 5,
    },
});

const consumer = kafka.consumer({
    groupId: "linkpulse-analytics-group",
})

async function startConsumer() {
    await consumer.connect();

    await consumer.subscribe({
        topic: "linkpulse.clicks",
        fromBeginning: true,
    });

    console.log("Analytics consumer is listening for click events");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (!message.value) return;

            try {
                const event = JSON.parse(message.value.toString());

                console.log("Click event received:", {
                    eventId: event.eventId,
                    shortCode: event.shortCode,
                    timestamp: event.timestamp,
                });
            } catch (error) {
                console.error("Invalid click event:", error.message);
            }
        },
    });
}

startConsumer().catch((error) => {
    console.error("Analytics consumer failed:", error);
    process.exitCode = 1;
});