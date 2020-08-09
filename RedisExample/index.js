const app = require('./server');
const https = require('https');
const fs = require('fs');

https.createServer({
    pfx : fs.readFileSync(__dirname + '/server.pfx'),
    passphrase : 'password'
  }, app).listen(3000,() => {
    console.log('server is listening at Port - '+3000);
})