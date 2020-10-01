const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 1
  },
	lastName: {
  	type: String,
		required: true,
		minlength: 1
	},
	phoneNumber: {
  	type: String,
		required: true,
		minlength: 10,
		maxlength: 10
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
	stripeId: {
  	type: String
	},
	isNotified: {
  	type: Boolean,
		required: true,
		default: false
	},
	isEmployee: {
  	type: Boolean,
		required: true,
		default: false
	},
	inactive: {
  	type: Boolean,
		required: true,
		default: false
	}
}, { timestamps: true })

module.exports = mongoose.model("User", UserSchema)