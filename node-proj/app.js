/*var http = require('http');

http.createServer(function(req,res){
    res.write('Hello World!');
    res.end();
}).listen(3000);
*/
var express = require('express');
var app = express();

app.get('/status', function (req, res) {
var status ={
    'Status': 'Running'
 };

   res.send('Hello World!!!!!');
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})