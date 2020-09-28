require("dotenv").config()
const db = require("../models")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const APP_SECRET = process.env.APP_SECRET
const accountSid = process.env.accountSid
const authToken = process.env.authToken
const twilio = require('twilio')(accountSid, authToken)

const resolver = {
	Query: {
		user: {
			description: "Returns a user based off their ID",
			resolve: async (_, {id, ...args}, context) => {
				if (!context.user) throw new Error("Protected Route, please login")
				if (context.user._id !== args.id || context.user.isEmployee !== true) throw new Error("You are not authorized to view another user")
				const foundUser = await db.User.findById(id)

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
		}
	},
	Mutation: {
		signup: {
			description: "Create a new user",
			resolve: async (_, args, context) => {
				args.password = await bcrypt.hash(args.password, 10)
				const newUser = await db.User.create({...args})
				const user = newUser

				const token = jwt.sign({userId: user._id}, APP_SECRET)

				return {
					token,
					user,
				}
			}
		},
		login: {
			description: "Login and authenticate",
			resolve: async (_, args, context) => {
				const loginUser = await db.User.findOne({email: args.email})
				if (!loginUser) {
					throw new Error("No such user found")
				}

				const valid = await bcrypt.compare(args.password, loginUser.password)
				if (!valid) {
					throw new Error("Invalid password")
				}

				const user = loginUser.toObject()

				console.log(user)

				return {
					token: jwt.sign(user, APP_SECRET),
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

				const newCleaning = await db.Cleaning.create({...args})

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
		}
	}
}

module.exports = resolver