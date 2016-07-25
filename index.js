var debug = require('debug')('elasticsearch-graphql')

function init (opts) {
  if (!opts.graphql || !opts.graphql.GraphQLInt) throw new Error('Missing graphql option, needed for internal reference')
  if (!opts.elastic.index) throw new Error('Missing elastic search index to fetch mapping from')
  if (!opts.elastic.type) throw new Error('Missing elastic search type to fetch mapping from')
  if (!opts.mapping) throw new Error('Missing elastic mapping')

  require('./graphql').set(opts.graphql)

  var schemaBuilder = require('./lib/schemaBuilder')

  var mapping = opts.mapping.mappings[opts.elastic.type]
  var properties = mapping.properties
  var transform = mapping.transform

  return schemaBuilder(opts, properties, transform)
}

module.exports = init
