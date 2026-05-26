import mongoose from "mongoose"
import { error } from "node:console"


const DB_URL = process.env.DB_URL as string

const mongoDB = async () => {
    try{
        await mongoose.connect(DB_URL)
        console.log("MongoDB connected")
    }catch (error){
        console.log("DB connection error:", error)
        process.exit(1)
    }
}

export default mongoDB