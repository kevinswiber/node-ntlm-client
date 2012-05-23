var request = require('request');
var Buffers = require('buffers');
var url = require('url');

var uri = process.argv[2];
var domain = process.argv[3];

request(uri, function(err, res) {
  var wwwAuthenticate = res.headers['www-authenticate'];

  if (wwwAuthenticate && res.statusCode === 401) {
    if (wwwAuthenticate.indexOf('NTLM') != -1) {
      sendType1Message(uri);
    }
  }
});

function sendType1Message(uri) {
  var domainLength = domain.length;
  var host = url.parse(uri).hostname;
  var hostLength = host.length;
  
  var buffers = new Buffers();
  buffers.push(new Buffer('NTLMSSP', 'ascii'));

  var header = new Buffer(9);
  header.writeUInt8(0, 0);
  header.writeUInt8(0x1, 1);
  header.writeUInt8(0, 2);
  header.writeUInt8(0, 3);
  header.writeUInt8(0, 4);
  header.writeUInt8(0x03, 5);
  header.writeUInt8(0xb2, 6);
  header.writeUInt8(0, 7);
  header.writeUInt8(0, 8);

  buffers.push(header);

  var lenBuffer = new Buffer(16);
  lenBuffer.writeUInt16LE(domainLength, 0);
  lenBuffer.writeUInt16LE(domainLength, 2);
  lenBuffer.writeUInt16LE(32 + hostLength, 4);
  lenBuffer.writeUInt8(0, 6);
  lenBuffer.writeUInt8(0, 7);
  lenBuffer.writeUInt16LE(hostLength, 8);
  lenBuffer.writeUInt16LE(hostLength, 10);
  lenBuffer.writeUInt16LE(32, 12);
  lenBuffer.writeUInt8(0, 14);
  lenBuffer.writeUInt8(0, 15);

  buffers.push(lenBuffer);

  var hostBuffer = new Buffer(host.toUpperCase(), 'ascii');
  var domainBuffer = new Buffer(domain.toUpperCase(), 'ascii');

  buffers.push(hostBuffer);
  buffers.push(domainBuffer);

  var buf = buffers.toBuffer();
  //console.log(buf.length);
  //console.log(buf);

  var message = buf.toString('base64');

  console.log(message);

  request(uri, { headers: { 'Authorization': 'NTLM ' + message } }, function(err, res) {
    var type2message = res.headers['www-authenticate'].split(', ')[0];
    console.log(type2message);
    //console.log(res.statusCode);
    //console.log(res.headers);
    //console.log(res.request.headers);
  });
}
