var _graphql

module.exports = {
  set: function (graphql) {
    if (!_graphql) _graphql = graphql
    return _graphql
  },
  get: function () {
    return _graphql
  }
}
