var esGraphQL = require('../index')
var hitsSchema = require('./data/hitsSchema')
var mapping = require('./data/mapping.json')
var graphql = require('graphql')
var test = require('tape')
var random_name = require('node-random-name')
var schemaName = random_name({first: true})

esGraphQL({
  graphql: graphql,
  name: schemaName,
  elastic: {
    mapping: mapping,
    index: 'articles',
    type: 'type',
    log: 'info'
  },
  hitsSchema: hitsSchema
})
  .then(function (schema) {
    test('Schema is defined', function (t) {
      t.plan(1)

      t.equal(schema.type.name, schemaName)
    })

    test('Args are set', function (t) {
      var expectedArgs = {
        id: {
          name: 'String',
          defaultValue: undefined
        },
        fields: {
          name: ['String'],
          defaultValue: undefined
        },
        page: {
          name: 'Int',
          defaultValue: undefined
        },
        query: {
          name: 'String',
          defaultValue: undefined
        },
        limit: {
          name: 'Int',
          defaultValue: 10
        },
        from: {
          name: 'Int',
          defaultValue: 0
        },
        filters: {
          name: 'Filters_' + schemaName,
          defaultValue: undefined
        }
      }

      t.plan((Object.keys(expectedArgs).length * 2) + 1)

      t.deepEqual(Object.keys(schema.args), Object.keys(expectedArgs), 'args length matches')

      Object.keys(schema.args).forEach((key) => {
        if (Array.isArray(expectedArgs[key].name)) {
          t.equal(schema.args[key].type.ofType.name, expectedArgs[key].name[0], `contains: ${key}`)
        } else {
          t.equal(schema.args[key].type.name, expectedArgs[key].name, `contains: ${key}`)
        }

        t.equal(schema.args[key].defaultValue, expectedArgs[key].defaultValue, `${key} default to ${expectedArgs[key].defaultValue}`)
      })
    })
  })
