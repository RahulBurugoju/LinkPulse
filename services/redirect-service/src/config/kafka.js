import { Kafka } from "kafkajs";
import {randomUUID} from "crypto";

const kafka = new Kafka({
    clientId:"linkpulse-redirect-service",
    brokers:(process.env.KAFKA_BROKERS || "localhost:9092").split(",").map((broker)=>broker.trim()),
    retry:{
        retries:2
    },
})

