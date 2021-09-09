const mongoose = require('mongoose')

const PostSchema = mongoose.Schema({
    post_text: {
        type: String,
        required: true
    },
    picture_link: {
        type: [String]
    },
    upvote: {
        type: [String]
    },
    downvote: {
        type: [String]
    },
    tag: {
        type: [String]
    },
    user_id: {
        type: String
        //require: true
    }
}, 
    {
    collection : "posts"
    }
);

const Post = mongoose.model("Post", PostSchema)
module.exports = Post