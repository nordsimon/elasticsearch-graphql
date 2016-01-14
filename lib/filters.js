var camelCase = require('lodash').camelCase
var _ = require('lodash')

function convertType (opts, type) {
  var graphql = opts.graphql

  var filterType = new opts.graphql.GraphQLEnumType({
    name: 'FilterType_' + _.uniqueId(),
    description: 'Different filter types',
    values: {
      AND: {
        value: 'AND'
      },
      OR: {
        value: 'OR'
      },
      NOT: {
        value: 'NOT'
      }
    }
  })

  switch (type) {
    case 'boolean':
      return new graphql.GraphQLInputObjectType({
        name: 'filter_' + _.uniqueId(),
        fields: {
          operator: { type: filterType },
          value: { type: graphql.GraphQLBoolean },
          values: { type: new graphql.GraphQLList(graphql.GraphQLBoolean) }
        }
      })
    case 'long':
      return new graphql.GraphQLInputObjectType({
        name: 'filter_' + _.uniqueId(),
        fields: {
          operator: { type: filterType },
          value: { type: graphql.GraphQLFloat },
          values: { type: new graphql.GraphQLList(graphql.GraphQLFloat) }
        }
      })
    case 'date':
    case 'string':
    default:
      return new graphql.GraphQLInputObjectType({
        name: 'filter_' + _.uniqueId(),
        fields: {
          operator: { type: filterType },
          value: { type: graphql.GraphQLString },
          values: { type: new graphql.GraphQLList(graphql.GraphQLString) }
        }
      })
  }
}

function convertFields (opts, current, properties) {
  Object.keys(properties).forEach(function (prop) {
    var p = properties[prop]
    var fields = {}
    var propName = camelCase(prop)
    var name = propName + '_' + _.uniqueId()

    if (p.properties) {
      current[propName] = {
        type: new opts.graphql.GraphQLInputObjectType({
          name: name,
          fields: fields
        })
      }

      convertFields(opts, fields, p.properties)
    } else {
      var type = convertType(opts, p.type, p)

      if (!type) return

      current[propName] = {
        type: type
      }
    }
  })

  return current
}

module.exports = function (opts, properties) {
  var fields = {}

  convertFields(opts, fields, properties)

  return new opts.graphql.GraphQLInputObjectType({
    name: 'Filters',
    description: 'filters',
    fields: fields
  })
}
