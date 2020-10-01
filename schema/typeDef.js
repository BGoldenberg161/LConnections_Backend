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
	  cleanings: [Cleaning!]!
	  invoices: [Invoice!]!
	  cards: [cardPaymentMethod!]!
	  banks: [bankPaymentMethod!]!
  }
  
  type Cleaning {
	  id: ID!
	  customer: User!
	  type: String!
	  date: DateTime!
	  address: String!
	  squareFootage: Float!
	  depositPaid: Boolean!
  }
  
  type Invoice {
	  id: ID!
	  stripeId: ID!
	  customer: User!
	  cleaning: Cleaning!
	  dueDate: Date!
	  amount: Int!
	  invoicePdf: String!
	  status: String!
  }
  
  type cardPaymentMethod {
    id: ID!
	  object: String!
    customer: ID!
	  address_line1: String!
    address_line2: String
	  address_city: String!
	  address_state: String!
	  address_zip: String!
	  brand: String!
	  cvc_check: String!
	  last4: String!
	  exp_month: Int!
	  exp_year: Int!
	  name: String!
  }
  
  type bankPaymentMethod {
	  id: ID!
	  object: String!
	  customer: ID!
    account_holder_name: String!
    account_holder_type: String!
    bank_name: String!
    routing_number: String!
    status: String!
  }
  
  type deletedPaymentMethod {
	  id: ID!
	  object: String!
	  deleted: Boolean!
  }

  type AuthPayload {
    token: String
    user: User
  }
  
  input Address {
		  address_line1: String!
		  address_line2: String
		  address_city: String!
		  address_state: String!
		  address_zip: String!
  }
  
  # Root Definitions (CRUD)
  type Query {
    user(id: ID!): User!
	  users: [User!]!
	  cleaning(id: ID!): Cleaning!
	  cleanings(customer: ID): [Cleaning!]!
	  invoice(id: ID!): Invoice!
	  invoices(customer: ID): [Invoice!]!
	  cardPaymentMethod(paymentId: ID!, customerId: ID!): cardPaymentMethod!
	  cardPaymentMethods(customerId: ID!): [cardPaymentMethod!]!
  }

  type Mutation {
    signup(firstName: String!, lastName: String!, phoneNumber: String!, email: String!, password: String!, birthday: Date!, address: Address!, isEmployee: Boolean): AuthPayload
    login(email: String!, password: String!): AuthPayload
	  updateUser(id: ID!, firstName: String, lastName: String, phoneNumber: String, email: String, password: String, birthday: Date, isNotified: Boolean, isEmployee: Boolean, inactive: Boolean): User!
	  createCleaning(customer: ID!, type: String!, date: DateTime!, address: String!, squareFootage: Float!, depositPaid: Boolean): Cleaning!
	  updateCleaning(id: ID!, type: String, date: DateTime, address: String, squareFootage: Float, depositPaid: Boolean): Cleaning!
	  deleteCleaning(id: ID!): String!
	  createInvoice(stripeId: ID!, customer: ID!, cleaning: ID!, description: String!, dueDate: Date!, amount: Int!, invoicePdf: String!, status: String!): Invoice!
	  updateInvoice(id: ID!, dueDate: Date, amount: Int, status: String): Invoice!
	  payInvoice(invoiceId: ID!, paymentMethod: ID!): Invoice!
	  createCardPaymentMethod(customerId: ID!, paymentToken: String!): cardPaymentMethod!
	  updateCardPaymentMethod(customerId: ID!, paymentId: ID!, address_line1: String, address_line2: String, address_city: String, address_state: String, address_zip: String, exp_month: Int, exp_year: Int, name: String): cardPaymentMethod!
	  deleteCardPaymentMethod(customerId: ID!, paymentId: ID!): deletedPaymentMethod!
  }
`

module.exports = typeDefs