var elasticTypes = require('../lib/elasticTypeToGraphQL')
var graphql = require('../graphql').get()
var FilterOperatorEnum = require('./FilterOperatorEnum')
var types = {}

module.exports = function (type) {
  if (types[type]) return types[type]

  types[type] = new graphql.GraphQLInputObjectType({
    name: ['Filter', type].join('_'),
    fields: {
      operator: { type: FilterOperatorEnum() },
      values: { type: new graphql.GraphQLList(elasticTypes[type]) }
    }
  })

  return types[type]
}
