var aggregations = require('./aggregations')
var createArgsFilters = require('./filters')
var flatten = require('flat')
var _ = require('lodash')

function argsFromMapping (properties) {
  return {}
}

function convertType (opts, type) {
  switch (type) {
    case 'boolean':
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLBoolean, opts.graphql.GraphQLInt)
      })
      break
    case 'long':
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLFloat, opts.graphql.GraphQLInt)
      })
      break
    case 'date':
    case 'string':
    default:
      return new opts.graphql.GraphQLObjectType({
        name: 'Bucket_' + _.uniqueId(),
        description: 'Bucket for string',
        fields: bucketFields(opts.graphql.GraphQLString, opts.graphql.GraphQLInt)
      })
      break
  }
}

function createAggregations (AST, parents, fields) {
  if (!AST.selectionSet) return

  AST.selectionSet.selections.forEach(function (sel) {
    if (sel.name.value !== 'buckets') {
      createAggregations(sel, parents.concat([sel.name.value]), fields)
    } else {
      var x = {
        'terms': {
          'field': parents.join('.')
        }
      }

      if (AST.arguments.length) {
        var limit = AST.arguments.filter(function (argument) {
          return argument.name.value === 'limit'
        })[0]

        var order = AST.arguments.filter(function (argument) {
          return argument.name.value === 'order'
        })[0]

        var direction = AST.arguments.filter(function (argument) {
          return argument.name.value === 'direction'
        })[0]

        if (limit) {
          x.terms.size = parseInt(limit.value.value)
        }

        if (order) {
          x.terms.order = {}
          x.terms.order['_' + order.value.value.toLowerCase()] = (direction) ? direction.value.value.toLowerCase() : 'asc'
        }
      }

      fields[parents.join('|')] = x
    }
  })
}

function aggFromAST (AST) {
  if (!AST) return {}
  var aggs = {}
  createAggregations(AST, [], aggs)

  return aggs
}

// var extractKeys = function(arr,keyString) {
//   if(arr.length === 0)
//     return keyString
//
//   var x = {}
//   x[_.head(arr)] = extractKeys(_.tail(arr), keyString)
//
//   return x
// }

function createFilterGroup (rawFilter) {
  filterProperties = flatten(rawFilter, {safe: true})
  var done = []

  return Object.keys(filterProperties).map(function (key) {
    var keys = key.split('.')
    keys.pop()

    var target

    if (done.indexOf(keys.join('.')) !== -1) return

    var values = _.get(rawFilter, keys.join('.') + '.values', [])
      .concat(_.get(rawFilter, keys.join('.') + '.value', []))
      .filter(function (val) { return val })

    if (!values.length) throw new Error('Filter missing field value or values')

    var operator = _.get(rawFilter, keys.join('.') + '.operator', 'AND')

    var filterGroup = {bool: {}}
    if (operator === 'AND') boolGroup = 'must'
    if (operator === 'OR') boolGroup = 'should'
    if (operator === 'NOT') boolGroup = 'must_not'
    filterGroup.bool[boolGroup] = []

    values.forEach(function (value) {
      var filter = {}

      filter[keys.join('.')] = value

      filterGroup.bool[boolGroup].push({
        term: filter
      })
    })

    // console.log(filterGroup)
    done.push(keys.join('.'))
    return filterGroup
  })
    .filter(function (group) { return group })
}

module.exports = function (opts, properties, transform) {
  var graphql = opts.graphql

  var filters = createArgsFilters(opts, properties, transform)

  return {
    resolve: function (root, params, data) {
      var filters
      var aggAST = data.fieldASTs[0].selectionSet.selections.filter(function (x) { return x.name.value === 'aggregations'})[0]
      var client = opts.client
      var aggregations = aggFromAST(aggAST)

      if (params.filters) {
        filters = Object.keys(params.filters).map(function (key) {
          var x = {}
          x[key] = params.filters[key]
          return createFilterGroup(x)
        })
      }

      var body = {
        _source: false
      }

      if (params.query) {
        body.query = {
          filtered: {
            query: {
              query_string: {
                fields: params.fields,
                query: params.query
              }
            }
          }
        }
      }

      body.aggregations = aggregations
      body.size = params.limit || 10

      if (filters) {
        _.set(body, 'query.filtered.filter', {
          bool: {
            must: filters
          }
        })
      }

      require('fs').writeFile('./body.json', JSON.stringify(body, null, 2))
      return client.search({
        index: opts.elastic.index,
        type: opts.elastic.type,
        body: body
      })
    },
    args: {
      id: {
        type: graphql.GraphQLString
      },
      page: {
        type: graphql.GraphQLInt
      },
      query: {
        type: graphql.GraphQLString
      },
      limit: {
        type: graphql.GraphQLInt
      },
      from: {
        type: graphql.GraphQLInt
      },
      filters: {
        type: filters
      }
    },
    type: new graphql.GraphQLObjectType({
      name: 'OrdersSearch',
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
            type: new opts.graphql.GraphQLList(opts.hitsType.type),
            args: opts.hitsType.args,
            resolve: function (response) {
              return opts.hitsType.resolve(response.hits.hits)
            }
          }
        }
      }
    })
  }
}
