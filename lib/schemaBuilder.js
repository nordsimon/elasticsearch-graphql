var aggregations = require('./aggregations')
var queryBuilder = require('./queryBuilder')
var createArgsFilters = require('./filters')
var graphql = require('../graphql').get()

module.exports = function (opts, properties, transform) {
  var argsFilters = createArgsFilters(opts, properties, transform)
  var aggs = aggregations(opts, properties, transform, argsFilters)
  opts._termsTranslation = aggs.termsTranslation

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
        type: argsFilters
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
            type: aggs.type,
            resolve: function (response) {
              return {aggregations: response.aggregations, firstLevel: true}
            }
          },
          hits: opts.hitsSchema
        }
      }
    })
  }
}
