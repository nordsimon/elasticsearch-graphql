var elasticsearch = require('elasticsearch')

function init (opts, cb) {
  if (!opts.graphql || !opts.graphql.GraphQLInt) return cb(new Error('Missing graphql option, needed for internal reference'))
  if (!opts.elastic.index) return cb(new Error('Missing elastic search index to fetch mapping from'))
  if (!opts.elastic.type) return cb(new Error('Missing elastic search type to fetch mapping from'))

  opts.client = new elasticsearch.Client({
    host: opts.elastic.host || 'localhost:9200',
    log: opts.elastic.log || 'trace'
  })

  require('./graphql').set(opts.graphql)

  var schemaBuilder = require('./lib/schemaBuilder')

  return opts.client.indices.getMapping({
    index: opts.elastic.index,
    type: opts.elastic.type
  }, function (err, response) {
    if (err) return cb(err)

    var indexes = Object.keys(response)
    var mapping = response[indexes[0]].mappings[opts.elastic.type]
    var properties = mapping.properties
    var transform = mapping.transform

    cb(null, schemaBuilder(opts, properties, transform))
  })
}

module.exports = init
