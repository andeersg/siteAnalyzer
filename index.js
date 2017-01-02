var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Analyzer = require('./analyzer.js');
var analyzer = new Analyzer();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile('index.html');
});

// Global flags:
var crawlInProgress = false;

// Socket communication:
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('crawlInit', function(url) {
    analyzer.setUrl(url);
    analyzer.crawl();
  });
});

// Analyzer events:
analyzer.on('log', function(data) {
  io.emit('log', data);
});
analyzer.on('pages', function() {
  io.emit('pages');
});
analyzer.on('finished', function() {
  io.emit('finished');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
