var graphql = require('../graphql').get()
var orderBy

module.exports = function () {
  if (orderBy) return orderBy

  orderBy = new graphql.GraphQLEnumType({
    name: 'OrderBy',
    description: 'Different order alternatives',
    values: {
      TERM: {
        value: '_term',
        description: 'Order values by term'
      },
      COUNT: {
        value: '_count',
        description: 'Order values by count'
      }
    }
  })

  return orderBy
}
