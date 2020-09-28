const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 30
  },
	name: {
  	type: String,
		required: true
	},
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
  },
  followingUsers: [{
    type: mongoose.Schema.Types.ObjectID,
    ref: "User"
  }],
  followingHashtags: [{
    type: String,
  }],
  profile: {
    bio: {
      type: String,
      default: "This is my Uphoria profile!"
    },
    instagramUrl: {
      type: String,
      default: "https://instagram.com/anthonygregis"
    },
    personalUrl: {
      type: String,
      default: "https://nopixel.online/"
    }
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectID,
    ref: "Video"
  }]
}, { timestamps: true })

module.exports = mongoose.model("User", UserSchema)