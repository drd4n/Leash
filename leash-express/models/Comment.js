const mongoose = require('mongoose')

const CommentSchema = mongoose.Schema({
    comment_text: {
        type: String,
        require: true
    },
    owner: {
        type: Object,
        require: true
    },
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