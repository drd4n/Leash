const mongoose = require('mongoose')

const OwnerSchema = mongoose.Schema({
    user_id: {
        type: String,
        require: true
    },
    firstname: {
        type: String,
        require: true
    },
    lastname: {
        type: String,
        require: true
    },
    profile_picture: {
        type: String
    },
    approval_status:{
        type: String
    }
})

const PostSchema = mongoose.Schema({
    post_text: {
        type: String,
        required: true
    },
    picture_link: {
        type: [String]
    },
    tags: {
        type: [String]
    },
    owner: {
        type: OwnerSchema
    }
},
    {
        collection: "posts"
    }
);

const Post = mongoose.model("Post", PostSchema)
module.exports = Post