const config = require("./config")
const staff = require("./config/twilio/staff")
const administrators = require("./config/twilio/administrators")
const client = require("twilio")(config.accountSid, config.authToken)

module.exports.sendSms = (to, message) => {
	return client.api.messages
		.create({
			body: message,
			to: to,
			from: config.sendingNumber,
		}).then(data => {
			console.log("SMS successfully sent")
		}).catch(err => {
			console.error("Could not send SMS")
			console.error(err)
		})
}

module.exports.notifyAdmin = (to, message) => {
	return client.api.messages
		.create({
			body: message,
			to: to,
			from: config.sendingNumber,
		}).then(data => {
			console.log("Administrator notified")
		}).catch(err => {
			console.error("Could not notify administrator")
			console.error(err)
		})
}

module.exports.staff = staff
module.exports.administrators = administrators