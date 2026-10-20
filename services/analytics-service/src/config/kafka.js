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

export const consumer = kafka.consumer({
    groupId: "linkpulse-analytics-group",
});

export default kafka;
