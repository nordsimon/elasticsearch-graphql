var elasticsearch = require('elasticsearch')

function init (opts) {
  if (!opts.graphql || !opts.graphql.GraphQLInt) return throw new Error('Missing graphql option, needed for internal reference')
  if (!opts.elastic.index) return throw new Error('Missing elastic search index to fetch mapping from')
  if (!opts.elastic.type) return throw new Error('Missing elastic search type to fetch mapping from')
  if (!opts.mapping) return throw new Error('Missing elastic mapping')

  if (opts.elastic.host) {
    opts.client = new elasticsearch.Client({
      host: opts.elastic.host || 'localhost:9200',
      log: opts.elastic.log || 'trace'
    })
  }

  require('./graphql').set(opts.graphql)

  var schemaBuilder = require('./lib/schemaBuilder')

  var indexes = Object.keys(opts.mapping)
  var mapping = opts.mapping[indexes[0]].mappings[opts.elastic.type]
  var properties = mapping.properties
  var transform = mapping.transform

  return schemaBuilder(opts, properties, transform)
}

module.exports = init
