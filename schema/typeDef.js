const {gql} = require("apollo-server")

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`    
  # Custom Scalars
  scalar Date
  scalar DateTime

  # Output Type Definitions
  type User {
    id: ID!
    firstName: String!
    lastName: String!
	  phoneNumber: String!
    email: String!
    password: String!
    birthday: Date!
	  stripeId: ID
	  isNotified: Boolean!
	  isEmployee: Boolean!
	  inactive: Boolean!
  }
  
  type Cleaning {
		  id: ID!
		  customer: User!
		  date: DateTime!
		  address: String!
		  squareFootage: Float!
		  depositPaid: Boolean!
  }
  
  type Invoice {
		  id: ID!
		  customer: User!
		  cleaning: Cleaning!
		  dueDate: Date!
		  amount: Int!
		  invoicePdf: String!
		  status: String!
  }

  type AuthPayload {
    token: String
    user: User
  }
  
  # Root Definitions (CRUD)
  type Query {
    user(id: ID!): User!
	  users: [User!]!
	  cleaning(id: ID!): Cleaning!
	  cleanings(customer: ID): [Cleaning!]!
	  invoice(id: ID!): Invoice!
	  invoices(customer: ID): [Invoice!]!
  }

  type Mutation {
    signup(firstName: String!, lastName: String!, phoneNumber: String!, email: String!, password: String!, birthday: Date!, isEmployee: Boolean): AuthPayload
    login(email: String!, password: String!): AuthPayload
	  updateUser(id: ID!, firstName: String, lastName: String, phoneNumber: String, email: String, password: String, birthday: Date, isNotified: Boolean, isEmployee: Boolean, inactive: Boolean): User!
	  createCleaning(customer: ID!, date: DateTime!, address: String!, squareFootage: Float!): Cleaning!
	  updateCleaning(id: ID!, date: DateTime, address: String, squareFootage: Float, depositPaid: Boolean): Cleaning!
	  deleteCleaning(id: ID!): String!
	  createInvoice(id: ID!, customer: ID!, cleaning: ID!, dueDate: Date!, amount: Int!, invoicePdf: String!, status: String!): Invoice!
	  updateInvoice(id: ID!, dueDate: Date, amount: Int, status: String): Invoice!
  }
`

module.exports = typeDefs