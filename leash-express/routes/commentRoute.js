const express = require('express')
const mongoose = require('mongoose')
const router = express.Router();
const cors = require('cors');
const app = express()
const verifyToken = require('../config/jwt')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use(express.static('public'));

//Post Models
const CommentModel = require('../models/Comment');
const InteractionModel = require('../models/Interaction');
const PostModel = require('../models/Post')
const UserModel = require('../models/User')

//route to create comment
router.route('/createComment').post(verifyToken,async(req, res, next) => {
    const commentText = req.body.comment_text
    const postObjectId = req.body.post_id
    const user = await UserModel.findById(req.user._id)
    const tags = await PostModel.findById(postObjectId).tags
    const comment = new CommentModel({
        comment_text: commentText,
        post_id: postObjectId,
        owner:{
            firstname:user.firstname,
            lastname:user.lastname
        }
    })

    try{
        comment.save();
        
        const interaction = new InteractionModel({
            user_id:user._id,
            post_id:postObjectId,
            tags:tags,
            interaction_type:"comment"
        })

        interaction.save()
        return res.send("comment sucessfully")
    }catch(error){
        next(error)
    }
})

//route to get comment
router.route('/showComment/:post_id').get(async (req, res, next) => {
    const postObjectId = req.params.post_id
    const data = await CommentModel.find({post_id: postObjectId})
    try {
        res.json(data)
    }catch(error) {
        return next(error)
    }
})

module.exports = router;