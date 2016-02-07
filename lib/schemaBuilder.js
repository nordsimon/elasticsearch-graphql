var aggregations = require('./aggregations')
var queryBuilder = require('./queryBuilder')
var createArgsFilters = require('./filters')

module.exports = function (opts, properties, transform) {
  var graphql = opts.graphql

  var filters = createArgsFilters(opts, properties, transform)

  return {
    resolve: queryBuilder.bind(this, opts),
    args: {
      id: {
        type: graphql.GraphQLString
      },
      fields: {
        type: new graphql.GraphQLList(graphql.GraphQLString)
      },
      page: {
        type: graphql.GraphQLInt
      },
      query: {
        type: graphql.GraphQLString
      },
      limit: {
        type: graphql.GraphQLInt,
        defaultValue: 10
      },
      from: {
        type: graphql.GraphQLInt,
        defaultValue: 0
      },
      filters: {
        type: filters
      }
    },
    type: new graphql.GraphQLObjectType({
      name: opts.name,
      description: 'An auto generated schema',
      fields: function () {
        return {
          took: {
            type: graphql.GraphQLInt,
            resolve: function (response) {
              return response.took
            }
          },
          maxScore: {
            type: graphql.GraphQLFloat,
            resolve: function (response) {
              return response.hits.max_score
            }
          },
          totalHits: {
            type: graphql.GraphQLInt,
            resolve: function (response) {
              return response.hits.total
            }
          },
          aggregations: {
            type: aggregations(opts, properties, transform),
            resolve: function (response) {
              return {aggregations: response.aggregations, firstLevel: true}
            }
          },
          hits: {
            type: new opts.graphql.GraphQLList(opts.hitsSchema.type),
            args: opts.hitsSchema.args,
            resolve: function (response) {
              return opts.hitsSchema.resolve(response.hits.hits)
            }
          }
        }
      }
    })
  }
}
