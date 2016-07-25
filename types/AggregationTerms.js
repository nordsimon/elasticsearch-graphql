var graphql = require('../graphql').get()
var elasticTypes = require('../lib/elasticTypeToGraphQL')

var types = {}

module.exports = function (type) {
  if (types[type]) return types[type]

  types[type] = new graphql.GraphQLObjectType({
    name: ['Terms', type].join('_'),
    description: 'Bucket with terms for: ' + type,
    fields: {
      value: {
        type: elasticTypes[type],
        resolve: function (bucket) {
          return bucket.key
        }
      },
      count: {
        type: graphql.GraphQLInt,
        resolve: function (bucket) {
          return bucket.doc_count
        }
      }
    }
  })

  return types[type]
}
