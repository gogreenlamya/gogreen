const mongoose = require("mongoose");

const FeedSchema = mongoose.Schema({
    rate:{
        type: Number,
    },
    name: {
        type: String,
        require: true,
    },
    phone: {
        type: Number,
        require: true,
    },
    feedback: {
        type: String,
        require: true,
    }
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedSchema);

module.exports = Feedback;
