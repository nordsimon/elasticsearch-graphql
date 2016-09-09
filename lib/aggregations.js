var OrderByEnum = require('../types/OrderByEnum')
var DirectionEnum = require('../types/DirectionEnum')
var AggregationTerms = require('../types/AggregationTerms')
var AggregationStats = require('../types/AggregationStats')

var camelCase = require('lodash').camelCase
var _ = require('lodash')
var unflatten = require('flat').unflatten

function convertFields (opts, current, properties, argsFilters, termsTranslation) {
  Object.keys(properties).forEach(function (prop) {
    var p = properties[prop]
    var fields = {}
    var type = camelCase(prop)
    var name = [type, _.uniqueId()].join('_')

    termsTranslation[type] = prop

    if (p.properties) {
      convertFields(opts, fields, p.properties, argsFilters, termsTranslation)
    } else {
      fields.terms = {
        type: new opts.graphql.GraphQLList(AggregationTerms(p.type)),
        args: {
          limit: {
            type: opts.graphql.GraphQLInt
          },
          order: {
            type: OrderByEnum()
          },
          direction: {
            type: DirectionEnum()
          },
          // filters: {
          //   type: argsFilters
          // }
        },
        resolve: function (data) {
          if (!data.aggs) return

          if(data.aggs.terms.sum_other_doc_count) {
            data.aggs.terms.buckets.push({
              key: null,
              doc_count: data.aggs.terms.sum_other_doc_count
            })
          }

          return data.aggs.terms.buckets
        }
      }

      if(['long','double', 'integer', 'float'].includes(p.type)) {
        fields.stats = {
          type: AggregationStats(),
          // args: {
          //   filters: {
          //     type: argsFilters
          //   }
          // },
          resolve: function (data) {
            if (!data.aggs) return

            return data.aggs.stats
          }
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

module.exports = function aggregationsFromMapping (opts, properties, transform, argsFilters) {
  var fields = {}
  var termsTranslation = {}
  convertFields(opts, fields, properties, argsFilters, termsTranslation)

  return {
    termsTranslation: termsTranslation,
    type: new opts.graphql.GraphQLObjectType({
      name: ['Aggregations', opts.name].join('_'),
      description: 'aggs',
      fields: function () {
        return fields
      }
    })
  }
}
