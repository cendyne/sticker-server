const path = require('path');
let filePath = process.env.FILES_PATH || './files/';
let staticPath = path.resolve('static');
if (filePath.endsWith('/')) {
  filePath = filePath.slice(0, -1);
}
filePath = path.resolve(...filePath.split('/'))
console.log('File path:', filePath)

module.exports = {
  filePath,
  staticPath
}
