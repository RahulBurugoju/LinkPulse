import { Kafka } from "kafkajs";
import {randomUUID} from "crypto";


//create kafka-client-configuration
const kafka = new Kafka({
    clientId:"linkpulse-redirect-service",
    brokers:(process.env.KAFKA_BROKERS || "localhost:9092").split(",").map((broker)=>broker.trim()),
    retry:{
        retries:2
    },
})

// create producer for publishing event
const producer=kafka.producer()

let isConnected = false;
let connectionPromise = null;

async function connectProducer(){
    if(isConnected) return;

    if(!connectionPromise){
        connectionPromise = producer.connect()
                                    .then(()=>{
                                        isConnected=true;
                                        console.log("Kafka producer connected")
                                    })
                                    .catch((error)=>{
                                        console.error("Kafka producer connection failed",error.message);
                                        connectionPromise=null;
                                        throw error;
                                    }).finally(()=>{
                                        connectionPromise=null;
                                    })
    }
    return connectionPromise;
}




// console.log(kafka.producer())