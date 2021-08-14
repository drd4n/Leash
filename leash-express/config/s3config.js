const dotenv = require('dotenv');
const result = dotenv.config();
module.exports ={
    port: 8085,
    region: "ap-southeast-1",
    credentials: {
        secretAccessKey: process.env.secretAccessKey,
        accessKeyId: process.env.accessKeyId
    }
}