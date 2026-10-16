import "dotenv/config"

import express from "express";


const app = express()

app.use(express.json())

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME


app.get("/health",(req, res)=>{
    res.status(200).json({
    status: "ok",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
});
})

app.listen(PORT,()=>{
    console.log(`${SERVICE_NAME} is running on port ${PORT}`)
});
