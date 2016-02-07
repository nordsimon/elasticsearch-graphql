var graphql = require('../graphql').get()
var direction

module.exports = function () {
  if (direction) return direction

  direction = new graphql.GraphQLEnumType({
    name: 'Direction',
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

  return direction
}
