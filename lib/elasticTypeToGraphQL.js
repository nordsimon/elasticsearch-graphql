var graphql = require('../graphql').get()

module.exports = {
  boolean: graphql.GraphQLBoolean,
  long: graphql.GraphQLFloat,
  integer: graphql.GraphQLInt,
  byte: graphql.GraphQLInt,
  double: graphql.GraphQLFloat,
  date: graphql.GraphQLString,
  string: graphql.GraphQLString
}
