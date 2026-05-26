import express from 'express'
import cors from 'cors'
import mongoDB from './config/db';


const PORT = process.env.PORT

const app = express();

app.use(cors());
app.use(express.json())

mongoDB();

app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`);
});