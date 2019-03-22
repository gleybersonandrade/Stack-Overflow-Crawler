# stackexchange-node
NPM module for StackExchange API + Node.js

Installation
----

```
npm i --save stackexchange-node
```

Usage
----

```js
var stackexchange = require('stackexchange-node');

var apiOptions = { version: 2.2 };
var api = new stackexchange(apiOptions);

var filter = {
  key: 'YOUR_API_KEY',
  pagesize: 50,
  tagged: 'node.js',
  sort: 'activity',
  order: 'asc'
};

// Get all the questions (http://api.stackexchange.com/docs/questions)
api.questions.questions(filter, function(err, results){
  if (err) throw err;
  
  console.log(results.items);
  console.log(results.has_more);
});
```
