# Elastic Search GraphQL
Schema and query builder for Elastic Search

- Creates a static typed [graphql](https://github.com/graphql/graphql-js) schema from an elastic search mapping
- Transforms your graphql query and creates an elastic search body
- Runs the search on your elastic index
- Returns the results and calls your hits schema

Disclaimer: This is a proof of concept. All features are working but bugs will appear. Contact me on [github](https://github.com/nordsimon/elasticsearch-graphql) for any issue and I'll look in to it

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Usage
```javascript
var graphql = require('graphql');
var esGraphQL = require('elasticsearch-graphql')
var hitsSchema = require('./schemas/myGraphQLSchema')

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

  var rootSchema = new graphql.GraphQLSchema({
    query: new graphql.GraphQLObjectType({
      name: 'RootQueryType',
      fields: {
        mySearchData: {
          type: schema.type,
          args: schema.args,
          resolve: schema.resolve
        }
      }
    })
  })
})
```



### Query Builder
It will fetch the current mapping from elasticsearch and create a static typed schema for you. Add the schema to you graphql server and the type helper will lead you. The hits field will resolve to whatever schema you send in. So you can use elasticsearch for searching data and then easily get your real data from anywhere. See full example in in /examples

###### Example query
```graphql
{
  ordersSearch(query: "New Order",
    filters: {
      images: {
        createdBy: {
          values: ["Simon Nord", "James Kyburz"],
          operator: OR
        }
      }
    }
  ) {
    aggregations {
      status {
        timestamp(limit: 5) {
          unhandledDocs
          buckets {
            key,
            count
          }
        }
      }
    }
    hits {
      id
    }
  }
}
```

### TODO
* Support multiple indexes
* Do smarter elasticsearch queries
* Add more options, like query type etc.
* Add tests
* Allow more aggregation types
* Allow more complex filters
