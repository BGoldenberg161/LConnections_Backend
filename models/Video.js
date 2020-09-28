const mongoose = require("mongoose")

const VideoSchema = new mongoose.Schema({
	videoUrl: {
		type: String,
		required: true
	},
  description: {
    type: String,
    default: ""
  },
  shares: {
    type: Number,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectID,
    ref: "User"
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectID,
    ref: "User",
	  default: []
  }]
}, { timestamps: true })

module.exports = mongoose.model("Video", VideoSchema)