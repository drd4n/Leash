const mongoose = require('mongoose')

const InteractionSchema = mongoose.Schema({
    user_id:{
        type:String,
        require:true
    },
    post_id:{
        type:String,
        require:true
    },
    interaction_type:{
        type:String,
        require:true
    },
    tags:{
        type:[String]
    }
})

const Interaction = mongoose.model("Interaction", InteractionSchema)
module.exports = Interaction