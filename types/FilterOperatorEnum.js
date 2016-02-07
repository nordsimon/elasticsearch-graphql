var graphql = require('../graphql').get()
var operator

module.exports = function () {
  if (operator) return operator

  operator = new graphql.GraphQLEnumType({
    name: 'FilterOperator',
    description: 'Different filter types',
    values: {
      AND: {
        value: 'must'
      },
      OR: {
        value: 'should'
      },
      NOT: {
        value: 'must_not'
      }
    }
  })

  return operator
}
