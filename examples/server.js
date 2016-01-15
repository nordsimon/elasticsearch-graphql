var esGraphQL = require('elasticsearch-graphql')
var graphql = require('graphql');
var hitsSchema = require('./schema')

var graphqlHTTP = require('express-graphql');
var express = require('express')
var cors = require('cors')

var app = express();

esGraphQL({
  graphql: graphql,
  name: 'ordersSearch',
  elastic: {
    host: 'localhost:9200',
    index: 'orders',
    type: 'order'
  },
  hitsSchema: hitsSchema
},function(err, schema) {

  app.use(cors());

  app.use('/graphql', graphqlHTTP({
    schema: new graphql.GraphQLSchema({
      query: new graphql.GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
          ordersSearch: {
            type: schema.type,
            args: schema.args,
            resolve: schema.resolve
          }
        }
      })
  }), graphiql: true }));

  app.listen(8000)
})
