// call all the required packages
const express = require('express');
const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/upload', function(req, res) {
    res.status(403);
    res.send("forbidden");
});

app.listen(3000, () => console.log('Server started on port 3000'));