var _ = require('lodash')
var flatten = require('flat')

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

    var boolGroup = _.get(rawFilter, target + '.operator', 'should')
    var filterGroup = {bool: {}}

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

function createAggregations (AST, parents, fields) {
  if (!AST.selectionSet) return

  AST.selectionSet.selections.forEach(function (sel) {
    if (['terms','stats'].indexOf(sel.name.value) === -1) {
      createAggregations(sel, parents.concat([sel.name.value]), fields)
    } else {
      var agg = {}
      agg[sel.name.value] = {
        field: parents.join('.')
      }

      sel.arguments.forEach(function(argument) {
        switch (argument.name.value) {
          case 'limit':
            agg[sel.name.value].size = parseInt(argument.value.value, 10)
            break;
          case 'direction':
          case 'order':
            agg[sel.name.value].order = {}
            agg[sel.name.value].order['_' + argument.value.value.toLowerCase()] = (direction) ? direction.value.value.toLowerCase() : 'asc'

            break
          default:

        }
      })

      fields[parents.concat(sel.name.value).join('|')] = agg
    }
  })
}

function aggFromAST (AST) {
  if (!AST) return {}
  var aggs = {}
  createAggregations(AST, [], aggs)

  return aggs
}

module.exports = function (opts, root, params, data) {
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
    _.set(body, 'query.filtered.query', {
      query_string: {
        fields: params.fields,
        query: params.query
      }
    })
  }

  body.aggregations = aggregations

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
}
