var _ = require('lodash')
var flatten = require('flat')
var request = require('request')

function createFilterGroup (rawFilter, termsTranslation) {
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
      var translated = target.split('.').map(x => termsTranslation[x]).join('.')

      filter[translated] = value

      filterGroup.bool[boolGroup].push({
        term: filter
      })
    })

    done.push(target)
    return filterGroup
  })
  .filter(function (group) { return group })
}

function createAggregations (AST, parents, fields, termsTranslation) {
  if (!AST.selectionSet) return

  AST.selectionSet.selections.forEach(function (sel) {
    if (['terms','stats','range'].indexOf(sel.name.value) === -1) {
      createAggregations(sel, parents.concat([sel.name.value]), fields, termsTranslation)
    } else {
      var agg = {}
      agg[sel.name.value] = {
        field: parents.map(x => termsTranslation[x]).join('.')
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

function aggsFromAST (AST, termsTranslation) {
  if (!AST) return {}
  var aggs = {}
  createAggregations(AST, [], aggs, termsTranslation)

  return aggs
}

module.exports = function (opts, root, params, context) {
  var AST = Array.prototype.filter.call(arguments, arg => arg && arg.hasOwnProperty('fieldASTs'))[0].fieldASTs[0]

  var filters
  var aggAST = AST.selectionSet.selections.filter(function (x) { return x.name.value === 'aggregations' })[0]
  var aggs = aggsFromAST(aggAST, opts._termsTranslation)

  if (params.filters) {
    filters = Object.keys(params.filters).map(function (key) {
      var x = {}
      x[key] = params.filters[key]
      return createFilterGroup(x, opts._termsTranslation)
    })
  }

  var body = {
    _source: false,
    size: params.limit,
    from: params.from
  }

  if (params.query) {
    _.set(body, 'query.filtered.query', {
      query_string: {
        fields: params.fields,
        query: params.query
      }
    })
  }

  body.aggs = aggs

  if (filters) {
    _.set(body, 'query.filtered.filter', {
      bool: {
        must: filters
      }
    })
  }

  if(opts.elastic.query) {
    body = opts.elastic.query(body, context)
  }

  return new Promise(function(resolve, reject) {
    request.post({
      uri: [opts.elastic.host, opts.elastic.index, opts.elastic.type,'_search'].join('/'),
      body: body,
      headers: opts.headers,
      json: true
    }, function(err, response, body) {
      if(err) return reject(err)
      if(body.error) return reject(body.error.reason)

      resolve(body)
    })
  })
}
