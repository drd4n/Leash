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
    tags: {
        type: [String]
    },
    owner: {
        type: Object
        //require: true
    }
}, 
    {
    collection : "posts"
    }
);

const Post = mongoose.model("Post", PostSchema)
module.exports = Post