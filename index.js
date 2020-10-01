require("dotenv").config()
const {ApolloServer, gql} = require("apollo-server-express")
const jwt = require("jsonwebtoken")
const typeDefs = require("./schema/typeDef")
const resolvers = require("./schema/resolver")
const express = require("express")
const APP_SECRET = process.env.APP_SECRET

const app = express()

const getUser = token => {
  try {
    if (token) {
      return jwt.verify(token, APP_SECRET)
    }
    return null
  } catch (err) {
    return null
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
	plugins: [
		require("./plugins/BasicLogging"),

		{
			serverWillStart() {
				console.log("GraphQL server starting up!")
			}
		}
	],
  context: ({req}) => {
    // get the user token from the headers
    const authorization = req.headers.authorization || ""

    //Grab the token
    const token = authorization.replace("Bearer ", "")
    const user = getUser(token)

    // add the user to the context
    return {user}
  },
	introspection: true,
	playground: true,
})

server.applyMiddleware({app})

app.listen({port: process.env.PORT || 8000}, function() {
  console.log(`Server ready at http://localhost:${this.address().port}${server.graphqlPath}`)
})
