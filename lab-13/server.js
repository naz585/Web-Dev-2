const https = require('https');
const fs = require('fs');
const options = {
key: fs.readFileSync('server.key'),
cert: fs.readFileSync('server.cert')
};
https.createServer(options, (req, res) => {
res.writeHead(200);
res.end('hello world\n');
}).listen(3000, () => {
console.log('Server is running on https://localhost:3000');
});