import {createClient} from 'redis'

const redisClient = createClient({
    url:process.env.REDIS_URL ||"redis://localhost:6379"
})

redisClient.on("error",(err)=>{
    console.error("Redis error this is the error : ",err)
})

redisClient.on("connect",()=>{
    console.log("Redis connected successfully")
})


async function connectRedis(){
    if(!redisClient.isOpen){
        await redisClient.connect();
    }
}

async function disconnectRedis(){
    if(redisClient.isOpen){
        await redisClient.quit();
    }
}

async function getRedisClient(){
    await connectRedis();
    return redisClient;
}




export {
    getRedisClient,
    connectRedis,
    disconnectRedis,
    redisClient
}