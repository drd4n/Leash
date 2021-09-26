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
    try {
        const downvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
        downvote.interaction_type = "upvote"
        return res.json({ interaction: "upvote" })
    } catch {
        try {
            const tags = await PostModel.findById({ post_id: post_id }).tags
            const interaction = new InteractionModel({
                user_id: req.user._id,
                post_id: post_id,
                tags: tags,
                interaction_type: "upvote"
            })
            return res.json({ interaction: "upvote" })
        } catch {
            await InteractionModel.findOneAndDelete({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
            return res.json({ interaction: "nointeraction" })
        }
    }
})

//downvote
router.route('/downvote').post(verifyToken, async (req, res, next) => {
    const post_id = req.body.post_id
    try {
        const upvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
        upvote.interaction_type = "downvote"
        return res.json({ interaction: "downvote" })
    } catch {
        try {
            const tags = await PostModel.findById({ post_id: post_id }).tags
            const interaction = new InteractionModel({
                user_id: req.user._id,
                post_id: post_id,
                tags: tags,
                interaction_type: "downvote"

            })
            return res.json({ interaction: "downvote" })
        } catch {
            await InteractionModel.findOneAndDelete({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
            return res.json({ interaction: "nointeraction" })
        }
    }
})

//showinteraction
router.route('/showInteraction/:post_id').get(verifyToken, async (req, res, next) => {
    const post_id = req.params.post_id
    try {
        const upvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "upvote" })
        return res.json({ interaction: upvote.interaction_type })
    } catch {
        try {
            const downvote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id, interaction_type: "downvote" })
            return res.json({ interaction: downvote.interaction_type })
        } catch {
            return res.json({ interaction: "nointeraction" })
        }
    }
})

module.exports = router;