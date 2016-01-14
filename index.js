var elasticsearch = require('elasticsearch')
var query = require('./lib/query')

function init (opts, cb) {
  opts.client = new elasticsearch.Client({
    host: opts.elastic.host || 'localhost:9200',
    log: 'debug'
  })

  return opts.client.indices.getMapping({
    index: opts.elastic.index,
    type: opts.elastic.type
  }, function (err, response) {
    if (err) return cb(err)

    var indexes = Object.keys(response)
    var mapping = response[indexes[0]].mappings[opts.elastic.type]
    var properties = mapping.properties
    var transform = mapping.transform

    cb(null, query(opts, properties, transform))
  })
}

module.exports = init
