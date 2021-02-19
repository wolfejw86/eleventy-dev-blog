const fs = require('fs');
const path = require('path');

const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || '/';
const swOutput = path.join(__dirname, '../../../_site/sw.js');

fs.readFile(swOutput, (err, swFile) => {
    fs.writeFile(swOutput, swFile.toString().replace(/\{\{PATH_PREFIX\}\}/g, pathPrefix), (err) => {
        console.log(err ? 'Failed to replace pathPrefix.' : 'Replaced pathPrefix Successfully.')
    })
});
