var aggregations = require('./aggregations')
var createArgsFilters = require('./filters')
var flatten = require('flat')
var _ = require('lodash')

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
          x.terms.size = parseInt(limit.value.value, 10)
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

function createFilterGroup (rawFilter) {
  var filterProperties = flatten(rawFilter, {safe: true})
  var done = []

  return Object.keys(filterProperties).map(function (key) {
    var keys = key.split('.')
    keys.pop()
    var target = keys.join('.')

    if (done.indexOf(target) !== -1) return

    var values = _.get(rawFilter, target + '.values', [])
      .concat(_.get(rawFilter, target + '.value', []))
      .filter(function (val) { return val })

    var operator = _.get(rawFilter, target + '.operator', 'AND')
    var boolGroup
    var filterGroup = {bool: {}}
    if (operator === 'AND') boolGroup = 'must'
    if (operator === 'OR') boolGroup = 'should'
    if (operator === 'NOT') boolGroup = 'must_not'
    filterGroup.bool[boolGroup] = []

    if (!values.length) throw new Error('Filter missing field value or values')

    values.forEach(function (value) {
      var filter = {}

      filter[target] = value

      filterGroup.bool[boolGroup].push({
        term: filter
      })
    })

    done.push(target)
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
      var aggAST = data.fieldASTs[0].selectionSet.selections.filter(function (x) { return x.name.value === 'aggregations' })[0]
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
      body.from = params.from || 0

      if (filters) {
        _.set(body, 'query.filtered.filter', {
          bool: {
            must: filters
          }
        })
      }

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
            type: new opts.graphql.GraphQLList(opts.hitsSchema.type),
            args: opts.hitsSchema.args,
            resolve: function (response) {
              return opts.hitsSchema.resolve(response.hits.hits)
            }
          }
        }
      }
    })
  }
}
