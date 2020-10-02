const mongoose = require("mongoose")

const InvoiceSchema = new mongoose.Schema({
	stripeId: {
		type: String,
		required: true
	},
	number: {
		type: String,
		required: true
	},
	customer: {
		type: mongoose.Schema.Types.ObjectID,
		required: true,
		ref: "User"
	},
	cleaning: {
		type: mongoose.Schema.Types.ObjectID,
		required: false,
		ref: "Cleaning"
	},
	dueDate: {
		type: Date,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	invoicePdf: {
		type: String,
		required: true
	},
	status: {
		type: String,
		required: true,
		default: "Pending"
	}
}, { timestamps: true })

module.exports = mongoose.model("Invoice", InvoiceSchema)