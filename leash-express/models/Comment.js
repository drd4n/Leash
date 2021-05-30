const mongoose = require('mongoose')

const CommentSchema = mongoose.Schema({
    comment_text: {
        type: String,
        require: true
    },
    upvote: {
        type: [String]
    },
    downvote: {
        type: [String]
    },
    // user_id: {
    //     type: mongoose.Types._ObjectId,
    //     require: true
    // },
    post_id: {
        type: String
    }
},
    {
        collection: "comments"
    }
);
const Comment = mongoose.model("Comment", CommentSchema)
module.exports = Comment