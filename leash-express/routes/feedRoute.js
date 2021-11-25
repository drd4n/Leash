const express = require('express')
const mongoose = require('mongoose')
const router = express.Router();
const cors = require('cors');
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use(express.static('public'));

//Post Models
const PostModel = require('../models/Post')


//route to get all post
router.route('/').get((req, res) => {
    PostModel.find((error, data) => {
        if(error) return console.log(error)
        else {
            res.json(data)
        }
    })
})

//route to get specific post
router.route('/feed/:postId').get((req, res, next) => {
    const _id = req.params.postId
    PostModel.findById(_id, (error, data) => {
        if(error) return next(error)
        else {
            res.json(data)
        }
    })
})

//route to get all posts of specific owner
router.route('/feed/:ownerId').get((req, res, next) => {
    const owner_id = req.params.ownerId
    PostModel.find({owner_id:owner_id}, (error, data) => {
        if(error) return next(error)
        else {
            res.json(data)
        }
    })
})

module.exports = router;