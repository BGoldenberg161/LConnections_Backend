require("dotenv").config()
const MONGO_URI = process.env.MONGO_URI
const ATLAS_URI = process.env.ATLAS_URI
const mongoose = require("mongoose")

mongoose.connect(ATLAS_URI || MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
})

const db = mongoose.connection

db.on("error", console.error.bind(console, "connection error:"))
db.once("open", function () {
  console.log("MongoDB connection opened at", db.host, db.port)
})

module.exports.User = require("./User")
module.exports.Cleaning = require("./Cleaning")
module.exports.Invoice = require("./Invoice")
module.exports.Product = require("./Product")