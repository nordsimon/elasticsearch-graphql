require('./index')({
  name: 'ordersSearch',
  elastic: {
    host: 'localhost:9200',
    index: 'orders',
    type: 'order'
  }
}, function(err, stuff) {
  console.log('callback done')
})
.then(function(query) {
  console.log(query)
})
