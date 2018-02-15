# Deprecated and no longer maintained

When I first started with grapql this was one of the big advantages I found, to generate a more user
friendly api out of already existing schema definitions. However this particular package has been stale for a while and I don't have any time to work on it. Also elastic and graphql is moving fast forward so to keep up with the apis are very hard. Hopefully i will get back to this package in the future since I think graphql is a very neat way to expose an api.

Until then, thanks for all the stars and please contact me if you have any ideas or would like to work on this tool


# Elastic Search GraphQL
Schema and query builder for Elastic Search

- Creates a static typed [graphql](https://github.com/graphql/graphql-js) schema from an elastic search mapping
- Transforms your graphql query and creates an elastic search body
- Runs the search on your elastic index
- Returns the results and calls your hits schema

For working example, checkout [elasticsearch-graphql-server-example](https://github.com/nordsimon/elasticsearch-graphql-server-example)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Compatibility
This package is tested and working on
- [graphql](https://github.com/graphql/graphql-js) version ^0.6.2 (should be okey from version 0.5.x)
- ElasticSearch version ^2.3.1

## Usage
```javascript
var graphql = require('graphql');
var esGraphQL = require('elasticsearch-graphql')
var hitsSchema = require('./schemas/myGraphQLSchema')

var schema = esGraphQL({
  graphql: graphql,
  name: 'ordersSearch',
  mapping: {
    "properties": {
      "id": {
        "type" : "string",
        "index" : "not_analyzed"
      },
      ...
    }
  },
  elastic: {
    host: 'localhost:9200',
    index: 'orders',
    type: 'order',
    query: function(query, context) {
      // Debug or modify the query anyway you want. The context is passed down from graphql
      // Make sure to return the original or modified query

      return query
    }
  },
  hitsSchema: hitsSchema
})

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
        }
      }
    }
  ) {
    aggregations {
      status {
        timestamp {
          terms(limit: 5) {
            value,
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
