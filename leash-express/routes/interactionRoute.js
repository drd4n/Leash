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

//Model
const CommentModel = require('../models/Comment');
const InteractionModel = require('../models/Interaction');
const PostModel = require('../models/Post')
const UserModel = require('../models/User')

//upvote
router.route('/upvote').post(verifyToken, async (req, res, next) => {
    const post_id = req.body.post_id
    const post = await PostModel.findOne({post_id: post_id})

    const downvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
    if (downvote) {
        downvote.interaction_type = "upvote"
        await downvote.save()
        post.upvote = post.upvote +1
        post.downvote = post.downvote -1
        await post.save()
        return res.json({ interaction: "upvote" })
    }

    const upvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
    if (upvote) {
        await upvote.deleteOne()
        post.upvote = post.upvote -1
        await post.save()
        return res.json({ interaction: "nointeraction" })
    }

    if (!upvote && !downvote) {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "upvote"
        })
        await interaction.save()
        post.upvote = post.upvote +1
        await post.save()
        return res.json({ interaction: "upvote" })
    }
})

//downvote
router.route('/downvote').post(verifyToken, async (req, res, next) => {
    const post_id = req.body.post_id
    const post = await PostModel.findById({_id: post_id})
    console.log(post)

    const upvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
    if (upvote) {
        upvote.interaction_type = "downvote"
        await upvote.save()
        post.upvote = post.upvote -1
        post.downvote = post.downvote +1
        await post.save()
        return res.json({ interaction: "downvote" })
    }

    const downvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
    if (downvote) {
        await downvote.deleteOne()
        post.downvote = post.downvote -1
        await post.save()
        return res.json({ interaction: "nointeraction" })
    }

    if (!upvote && !downvote) {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "downvote"
        })
        await interaction.save()
        post.downvote = post.downvote +1
        await post.save()
        return res.json({ interaction: "downvote" })
    }
})

//showinteraction
router.route('/showInteraction/:post_id').get(verifyToken, async (req, res, next) => {
    const post_id = req.params.post_id

    const upvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
    if (upvote) {
        return res.json({ interaction: upvote.interaction_type })
    }

    const downvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
    if (downvote) {
        return res.json({ interaction: downvote.interaction_type })
    }

    if (!downvote && !upvote) {
        return res.json({ interaction: "nointeraction" })
    }

})

module.exports = router;