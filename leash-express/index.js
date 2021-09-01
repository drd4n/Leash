const express = require('express')
const mongoose = require('mongoose')
var cors = require('cors');
const createError = require('http-errors')

const app = express()

const db = "mongodb+srv://leashposts:leashmasterposts@leash.t5u93.mongodb.net/Leash?retryWrites=true&w=majority";

require("dotenv").config();

app.use(express.json())
app.use(cors())

//Connecting MongoDB
mongoose.connect(
    db,{ useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    error => {
        console.log('Could not connect to database: ' + error)
    }
});
console.log('db connected')

//Express Route
const postRoute = require('./routes/postRoute')
const feedRoute = require('./routes/feedRoute')
const commentRoute = require('./routes/commentRoute')
const authRoute = require('./routes/authRoute' )

app.use('/', feedRoute)
app.use('/post', postRoute)
app.use('/comment', commentRoute)
app.use('/auth', authRoute)

//Port
const port = process.env.PORT || 3001;
app.listen(process.env.PORT || 3001, () => {
    console.log('Yark Ja Norn on port ' + port)
});
 
//404 Error handler
app.use((req, res, next) => {
    next(createError(404))
})

//Exception handler
app.use(function(err, req, res, next) {
    console.error(err.message);
    if(!err.statusCode){
        err.statusCode = 500;
    }
    res.status(err.statusCode).send(err.message);
})
