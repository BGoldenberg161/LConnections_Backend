const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
	stripeId: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
}, { timestamps: true })

module.exports = mongoose.model("Product", ProductSchema)