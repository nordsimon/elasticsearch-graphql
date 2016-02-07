var camelCase = require('lodash').camelCase
var _ = require('lodash')
var Filter = require('../types/Filter')

function convertFields (opts, current, properties) {
  Object.keys(properties).forEach(function (prop) {
    var p = properties[prop]
    var fields = {}
    var propName = camelCase(prop)
    var name = [propName, _.uniqueId()].join('_')

    if (p.properties) {
      current[propName] = {
        type: new opts.graphql.GraphQLInputObjectType({
          name: name,
          fields: fields
        })
      }

      convertFields(opts, fields, p.properties)
    } else {
      current[propName] = {
        type: Filter(p.type)
      }
    }
  })

  return current
}

module.exports = function (opts, properties) {
  var fields = {}

  convertFields(opts, fields, properties)

  return new opts.graphql.GraphQLInputObjectType({
    name: 'Filters_' + opts.name,
    description: 'filters',
    fields: fields
  })
}
