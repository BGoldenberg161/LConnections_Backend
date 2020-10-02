const config = require("../config")
const db = require("../models")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const stripe = require("stripe")(config.stripeSecretKey)
const twilioClient = require("../twilioClient")

const resolver = {
	Query: {
		user: {
			description: "Returns a user based off their ID",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id != args.id) {
					if (context.user.isEmployee != true) {
						throw new Error("You are not authorized to view another user")
					} else {
						console.log("Admin checked users")
					}
				}
				const foundUser = await db.User.findById(args.id)
				let upcomingCleanings = await db.Cleaning.aggregate([
					// Get only records created in the last 30 days
					{$match:{
							"date":{$gt: new Date()}
						}},
					// Get the year, month and day from the date field
					{$project:{
							"year":{$year:"$date"},
							"month":{$month:"$date"},
							"day": {$dayOfMonth:"$date"}
						}},
					// Group by year, month and day and get the count
					{$group:{
							_id:{$concat: [{$toString: "$month"}, "/", {$toString: "$day"}, "/", {$toString: "$year"}]},
							"count":{$sum:1}
						}}
				])


				foundUser.cleanings = await db.Cleaning.find({customer: args.id})
				foundUser.invoices = await db.Invoice.find({customer: args.id}).populate("cleaning")
				foundUser.blockedDates = upcomingCleanings.filter(cleaning => cleaning.count >= 2)

				let updatedInvoices = await stripe.invoices.list({
					customer: foundUser.stripeId
				})

				console.log(updatedInvoices)

				for(let i = 0; i < updatedInvoices.data.length; i++) {
					let updatedInvoice = updatedInvoices.data[i]
					let foundInvoice = await db.Invoice.findOne({stripeId: updatedInvoice.id}, function (err, invoice) {
						if(invoice != null) {
							// console.log("DB Invoice:", invoice)
							invoice.status = updatedInvoice.status
							invoice.save(function (err) {
								if(err) {
									// console.error('ERROR!');
								}
							})
						} else {
							// console.log(invoice)
						}
					})
				}

				foundUser.invoices = await db.Invoice.find({customer: args.id}).populate("cleaning")

				let userCards = await stripe.customers.listSources(
					foundUser.stripeId,
					{object: 'card'}
				)

				let userBanks = await stripe.customers.listSources(
					foundUser.stripeId,
					{object: 'bank_account'}
				)
				foundUser.cards = userCards.data
				foundUser.banks = userBanks.data

				return foundUser
			}
		},
		users: {
			description: "Returns all users",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user.isEmployee !== true) throw new Error("You are not authorized to view other users")

				const foundUsers = await db.User.find()

				return foundUsers
			}
		},
		cleaning: {
			description: "Returns a cleaning based off cleaning id",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id != args.id) {
					if (context.user.isEmployee != true) {
						throw new Error("You are not authorized to view another user")
					} else {
						console.log("Admin checked users")
					}
				}

				const foundCleaning = await db.Cleaning.findById(args.id).populate("customer")

				return foundCleaning
			}
		},
		cleanings: {
			description: "Returns all cleanings (Optionally: Based off customer id)",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id != args.customer) {
					if (context.user.isEmployee != true) {
						throw new Error("You are not authorized to view another users cleanings")
					} else {
						console.log("Admin checked users")
					}
				}

				const foundCleanings = await db.Cleaning.find(args).populate("customer")

				return foundCleanings
			}
		},
		cardPaymentMethod: {
			description: "Returns a user's card payment method by customer id and payment id",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (!context.user.stripeId !== args.customerId) {
					if (context.user.isEmployee != true) {
						throw new Error("You are not authorized to view another users payment methods")
					} else {
						console.log("Admin checked users payment methods")
					}
				}

				const card = await stripe.customers.retrieveSource(args.customerId, args.paymentId)

				return card
			}
		},
		cardPaymentMethods: {
			description: "Return all cards listed under a user by customer id",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (!context.user.stripeId !== args.customerId) {
					if (context.user.isEmployee != true) {
						throw new Error("You are not authorized to view another users payment methods")
					} else {
						console.log("Admin checked users payment methods")
					}
				}

				const cards = await stripe.customers.listSources(
					args.customerId,
					{object: "card"}
				)

				return cards.data
			}
		}
	},
	Mutation: {
		signup: {
			description: "Create a new user",
			resolve: async (_, args, context) => {
				let newStripeCustomer

				args.password = await bcrypt.hash(args.password, 10)

				if (!args.isEmployee) {
					newStripeCustomer = await stripe.customers.create({
						address: {
							line1: args.address.address_line1,
							line2: args.address.address_line2 || "",
							city: args.address.address_city,
							state: args.address.address_state,
							postal_code: args.address.address_zip
						},
						email: args.email,
						name: args.firstName + " " + args.lastName,
						phone: args.phoneNumber,
					})
				}

				const newUser = await db.User.create({...args, stripeId: newStripeCustomer.id})
				const user = newUser
				const token = jwt.sign({userId: user._id}, config.appSecret)

				return {
					token,
					user
				}
			}
		},
		login: {
			description: "Login and authenticate",
			resolve: async (_, args, context) => {
				const user = await db.User.findOne({email: args.email})
				if (!user) {
					throw new Error("No such user found")
				}

				const valid = await bcrypt.compare(args.password, user.password)
				if (!valid) {
					throw new Error("Invalid password")
				}

				console.log(user)

				return {
					token: jwt.sign(user.toObject(), config.appSecret),
					user,
				}
			}
		},
		updateUser: {
			description: "Update a user",
			resolve: async (_, {id, ...setArgs}, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id !== id || context.user.isEmployee !== true) throw new Error("You are not authorized to update another user")

				return await db.User.findByIdAndUpdate({_id: id}, {$set: {...setArgs}}, {"new": true})
			}
		},
		createCleaning: {
			description: "Create a cleaning",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				let newCleaning = await db.Cleaning.create({...args})
				newCleaning = await newCleaning.populate("customer").execPopulate()

				await twilioClient.sendSms(newCleaning.customer.phoneNumber, `Cleaning Scheduled: You've scheduled a ${newCleaning.type} cleaning for ${new Date(newCleaning.date).toLocaleString("en-us", { timeZone: 'America/Chicago' })} at ${newCleaning.address}`)

				twilioClient.administrators.forEach(admin => {
					twilioClient.sendSms(admin.phoneNumber, `New Cleaning Scheduled: ${newCleaning.customer.firstName} ${newCleaning.customer.lastName} has scheduled a ${newCleaning.type} cleaning for ${newCleaning.squareFootage} square feet at ${newCleaning.address} on ${new Date(newCleaning.date).toLocaleString("en-us", { timeZone: 'America/Chicago' })}`)
				})

				return newCleaning
			}
		},
		updateCleaning: {
			description: "Update a scheduled cleaning",
			resolve: async (_, {id, ...setArgs}, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id !== id || context.user.isEmployee !== true) throw new Error("You are not authorized to update user's cleaning")

				const updatedCleaning = await db.Cleaning.findByIdAndUpdate({_id: id}, {$set: {...setArgs}}, {"new": true})

				return updatedCleaning
			}
		},
		deleteCleaning: {
			description: "Cancel a cleaning",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id !== id || context.user.isEmployee !== true) throw new Error("You are not authorized to delete another user's cleaning")

				await db.Cleaning.findByIdAndDelete({_id: id})

				return "Successfully cancelled a cleaning"
			}
		},
		createInvoice: {
			description: "Create an invoice",
			resolve: async (_, {description, ...args}, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user.isEmployee !== true) throw new Error("You are not authorized to create invoices")

				const customer = await db.User.findById(args.customer)
				const cleaning = await db.Cleaning.findById(args.cleaning)
				let product = await db.Product.find({name: args.type})

				let stripeCustomer = await stripe.customers.list({
					email: customer.email,
					limit: 1
				})

				if (stripeCustomer.data.length < 1) {
					stripeCustomer = await stripe.customers.create({
						address: customer.address,
						email: customer.email,
						name: customer.firstName + " " + customer.lastName,
						phone: customer.phoneNumber
					})
				} else {
					stripeCustomer = stripeCustomer.data[0]
				}

				if(product.length < 1) {
					product = await stripe.products.create({
						name: cleaning.type
					})

					product = await db.Product.create({stripeId: product.id, name: product.name})
				}

				const price = await stripe.prices.create({
					nickname: args.description,
					unit_amount: args.amount * 100,
					currency: 'usd',
					product: product.stripeId
				});

				const invoiceItem = await stripe.invoiceItems.create({
					customer: stripeCustomer.id,
					price: price.id
				})

				let invoice = await stripe.invoices.create({
					customer: stripeCustomer.id,
					collection_method: "send_invoice",
					due_date: Math.floor(new Date(args.dueDate).getTime() / 1000),
					description: description,
				})

				let finalizedInvoice = await stripe.invoices.finalizeInvoice(
					invoice.id
				);

				console.log("Draft:", invoice)
				console.log("Final:", finalizedInvoice)

				args.number = finalizedInvoice.number
				args.stripeId = invoice.id
				args.invoicePdf = finalizedInvoice.hosted_invoice_url

				let newInvoice = await db.Invoice.create({...args})
				newInvoice = await newInvoice.populate("customer").populate("cleaning").execPopulate()

				return newInvoice
			}
		},
		payInvoice: {
			description: "Pay an invoice",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")

				const paidInvoice = await stripe.invoices.pay(
					`${args.invoiceId}`,
					{source: args.paymentMethod}
				)

				const foundInvoice = await db.Invoice.findOne({stripeId: args.invoiceId}).populate("cleaning")
				await db.Cleaning.findByIdAndUpdate(foundInvoice.cleaning._id,{"depositPaid": true})

				return paidInvoice
			}
		},
		createCardPaymentMethod: {
			description: "Create a new payment method",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")

				const newPaymentMethod = await stripe.customers.createSource(
					args.customerId,
					{source: args.paymentToken}
				)

				return newPaymentMethod
			}
		},
		updateCardPaymentMethod: {
			description: "Update an existing payment method",
			resolve: async (_, {customerId, paymentId, ...args}, context) => {
				if (!context.user) throw new Error("Protected Route, please login")

				const updatedPaymentMethod = await stripe.customers.updateSource(
					customerId,
					paymentId,
					{...args}
				)

				return updatedPaymentMethod
			}
		},
		deleteCardPaymentMethod: {
			description: "Delete a payment method",
			resolve: async (_, args, context) => {
				if (!context.user) throw new Error("Protected Route, please login")

				const deletedPaymentMethod = await stripe.customers.deleteSource(
					args.customerId,
					args.paymentId
				)

				return deletedPaymentMethod
			}
		}
	}
}

module.exports = resolver