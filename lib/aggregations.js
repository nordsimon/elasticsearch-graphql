var OrderByEnum = require('../types/OrderByEnum')
var DirectionEnum = require('../types/DirectionEnum')
var Bucket = require('../types/Bucket')

var camelCase = require('lodash').camelCase
var _ = require('lodash')
var unflatten = require('flat').unflatten

function convertFields (opts, current, properties) {
  Object.keys(properties).forEach(function (prop) {
    var p = properties[prop]
    var fields = {}
    var type = camelCase(prop)
    var name = [type, _.uniqueId()].join('_')

    if (p.properties) {
      convertFields(opts, fields, p.properties)
    } else {
      fields.unhandledDocs = {
        type: opts.graphql.GraphQLInt,
        resolve: function (data) {
          if (!data.aggs) return

          return data.aggs.sum_other_doc_count
        }
      }

      fields.buckets = {
        type: new opts.graphql.GraphQLList(Bucket(p.type)),
        resolve: function (data) {
          if (!data.aggs) return

          return data.aggs.buckets
        }
      }
    }

    if (!Object.keys(fields).length) return

    current[type] = {
      name: name,
      resolve: function (data) {
        if (data.firstLevel) data.aggs = unflatten(data.aggregations, {delimiter: '|'})

        return {
          aggs: data.aggs[type]
        }
      },
      args: {
        limit: {
          type: opts.graphql.GraphQLInt
        },
        order: {
          type: OrderByEnum()
        },
        direction: {
          type: DirectionEnum()
        }
      },
      type: new opts.graphql.GraphQLObjectType({
        name: name,
        description: 'None',
        fields: function (aggregations) {
          return fields
        }
      })
    }
  })

  return current
}

module.exports = function aggregationsFromMapping (opts, properties) {
  var fields = {}
  convertFields(opts, fields, properties)

  return new opts.graphql.GraphQLObjectType({
    name: ['Aggregations', opts.name].join('_'),
    description: 'aggs',
    fields: function () {
      return fields
    }
  })
}
