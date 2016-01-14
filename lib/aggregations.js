var camelCase = require('lodash').camelCase
var _ = require('lodash')

var extractKeys = function (arr, keyString) {
  if (arr.length === 0) return keyString

  var x = {}
  x[_.head(arr)] = extractKeys(_.tail(arr), keyString)

  return x
}

var bucketFields = function (keyType, countType) {
  return {
    key: {
      type: keyType,
      resolve: function (bucket) {
        return bucket.key
      }
    },
    count: {
      type: countType,
      resolve: function (bucket) {
        return bucket.doc_count
      }
    }
  }
}

function convertType (opts, type) {
  switch (type) {
    case 'boolean':
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLBoolean, opts.graphql.GraphQLInt)
      })
    case 'long':
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLFloat, opts.graphql.GraphQLInt)
      })
    case 'date':
    case 'string':
    default:
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLString, opts.graphql.GraphQLInt)
      })
  }
}

function convertFields (opts, current, properties) {
  var orderByType = new opts.graphql.GraphQLEnumType({
    name: 'OrderBy_' + _.uniqueId(),
    description: 'Different order alternatives',
    values: {
      TERM: {
        value: '_term',
        description: 'Order values by term'
      },
      COUNT: {
        value: '_count',
        description: 'Order values by count'
      }
    }
  })

  var directionType = new opts.graphql.GraphQLEnumType({
    name: 'OrderBy_' + _.uniqueId(),
    description: 'Different order alternatives',
    values: {
      ASC: {
        value: 'asc'
      },
      DESC: {
        value: 'desc'
      }
    }
  })

  Object.keys(properties).forEach(function (prop) {
    var p = properties[prop]
    var fields = {}

    if (p.properties) {
      convertFields(opts, fields, p.properties)
    } else {
      fields.unhandledDocs = {
        type: opts.graphql.GraphQLInt,
        resolve: function (data) {
          if (!data.aggregations[data.keys]) return

          return data.aggregations[data.keys].sum_other_doc_count
        }
      }

      var bucketType = convertType(opts, p.type)

      if (!bucketType) return

      fields.buckets = {
        type: new opts.graphql.GraphQLList(bucketType),
        resolve: function (data) {
          if (!data.aggregations[data.keys]) return

          return data.aggregations[data.keys].buckets
        }
      }
    }

    var type = camelCase(prop)
    var name = camelCase(prop) + '_' + _.uniqueId()

    if (!Object.keys(fields).length) return

    var x = {
      name: name,
      resolve: function (data) {
        if (data.firstLevel) {
          var keys = Object.keys(data.aggregations)
          var extractedKeys = {}

          keys.forEach(function (keyString) {
            extractedKeys[keyString.split('|')[0]] = extractKeys(keyString.split('|'), keyString)
          })

          return {
            keys: extractedKeys[type][type],
            aggregations: data.aggregations
          }
        } else {
          return {
            keys: data.keys[type],
            aggregations: data.aggregations
          }
        }
      },
      args: {
        limit: {
          type: opts.graphql.GraphQLInt
        },
        order: {
          type: orderByType
        },
        direction: {
          type: directionType
        }
      },
      type: new opts.graphql.GraphQLObjectType({
        name: camelCase(prop) + '_' + _.uniqueId(),
        description: 'None',
        fields: function (aggregations) {
          return fields
        }
      })
    }

    current[camelCase(prop)] = x
  })

  return current
}

module.exports = function aggregationsFromMapping (opts, properties) {
  var fields = {}
  convertFields(opts, fields, properties)

  return new opts.graphql.GraphQLObjectType({
    name: 'Aggregations',
    description: 'aggs',
    fields: function () {
      return fields
    }
  })
}
