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
    const vote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id })

    if (!vote) {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "upvote"
        })
        interaction.save()
        return res.json({ interaction: "upvote" })
    }

    if (vote.interaction_type !== "post" && vote.interaction_type !== "comment" && vote.interaction_type !== "downvote" && vote.interaction_type !== "upvote") {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "upvote"
        })
        interaction.save()
        return res.json({ interaction: "upvote" })
    }

    if (vote.interaction_type === "downvote") {
        vote.interaction_type = "upvote"
        vote.save()
        return res.json({ interaction: "upvote" })
    }

    if (vote.interaction_type === "upvote") {
        vote.deleteOne()
        return res.json({ interaction: "nointeraction" })
    }
})

//downvote
router.route('/downvote').post(verifyToken, async (req, res, next) => {
    const post_id = req.body.post_id
    const vote = await InteractionModel.findOne({ user_id: req.user._id, post_id: post_id })

    if (!vote) {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "downvote"
        })
        interaction.save()
        return res.json({ interaction: "downvote" })
    }

    if (vote.interaction_type !== "post" && vote.interaction_type !== "comment" && vote.interaction_type !== "downvote" && vote.interaction_type !== "upvote") {
        const interaction = new InteractionModel({
            user_id: req.user._id,
            post_id: post_id,
            tags: req.body.tags,
            interaction_type: "downvote"
        })
        interaction.save()
        return res.json({ interaction: "downvote" })
    }

    if (vote.interaction_type === "upvote") {
        vote.interaction_type = "downvote"
        vote.save()
        return res.json({ interaction: "downvote" })
    }

    if (vote.interaction_type === "downvote") {
        vote.deleteOne()
        return res.json({ interaction: "nointeraction" })
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