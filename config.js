require("dotenv").config()
const cfg = {}

cfg.appSecret = process.env.APP_SECRET
cfg.accountSid = process.env.TWILIO_ACCOUNT_SID
cfg.authToken = process.env.TWILIO_AUTH_TOKEN
cfg.sendingNumber = process.env.TWILIO_NUMBER
cfg.stripePublishKey = process.env.STRIPE_PUBLISH_KEY
cfg.stripeSecretKey = process.env.STRIPE_SECRET_KEY

let requiredConfig = [cfg.accountSid, cfg.authToken, cfg.sendingNumber, cfg.appSecret, cfg.stripePublishKey, cfg.stripeSecretKey]
let isConfigured = requiredConfig.every(function (configValue) {
	return configValue || false
})

if (!isConfigured) {
	let errorMessage = "All twilio parameters and app secret must be set in the .env file."

	throw new Error(errorMessage)
}

module.exports = cfg