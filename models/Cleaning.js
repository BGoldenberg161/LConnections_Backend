const mongoose = require("mongoose")

const CleaningSchema = new mongoose.Schema({
	customer: {
		type: mongoose.Schema.Types.ObjectID,
		required: true,
		ref: "User"
	},
	type: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	squareFootage: {
		type: Number,
		required: true
	},
	depositPaid: {
		type: Boolean,
		required: true,
		default: false
	}
}, { timestamps: true })

module.exports = mongoose.model("Cleaning", CleaningSchema)