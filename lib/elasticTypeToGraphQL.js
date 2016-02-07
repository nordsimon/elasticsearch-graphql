var graphql = require('../graphql').get()

module.exports = {
  boolean: graphql.GraphQLBoolean,
  long: graphql.GraphQLFloat,
  date: graphql.GraphQLString,
  string: graphql.GraphQLString
}
