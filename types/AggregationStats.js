var graphql = require('../graphql').get()
var elasticTypes = require('../lib/elasticTypeToGraphQL')

var stats

module.exports = function (type) {
  if (stats) return stats

  stats = new graphql.GraphQLObjectType({
    name: 'Aggregation_Stats',
    description: 'Stats aggregation for: ' + type,
    fields: {
      count: {
        type: graphql.GraphQLFloat,
        resolve: function (data) {
          return data.count
        }
      },
      min: {
        type: graphql.GraphQLFloat,
        resolve: function (data) {
          return data.min
        }
      },
      max: {
        type: graphql.GraphQLFloat,
        resolve: function (data) {
          return data.max
        }
      },
      avg: {
        type: graphql.GraphQLFloat,
        resolve: function (data) {
          return data.avg
        }
      },
      sum: {
        type: graphql.GraphQLFloat,
        resolve: function (data) {
          return data.sum
        }
      }
    }
  })

  return stats
}
