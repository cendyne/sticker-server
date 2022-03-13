const path = require('path');
let staticPath = path.resolve('static');

let filePath = process.env.FILES_PATH || './files/';
console.log('File path before mod:', filePath)
if (filePath.endsWith('/')) {
  console.log('Trimming file path end')
  filePath = filePath.slice(0, -1);
}
if (filePath.startsWith('.')) {
  console.log('Resolving file path')
  filePath = path.resolve(...filePath.split('/'))
}
console.log('File path:', filePath)

const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

module.exports = {
  filePath,
  staticPath,
  baseUrl,
}
