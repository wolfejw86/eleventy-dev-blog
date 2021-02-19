const fs = require("fs");
const path = require("path");

const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";
const swOutput = path.join(__dirname, "../../../_site/sw.js");
const manifestOutput = path.join(
    __dirname,
    "../../../_site/manifest.webmanifest"
);

module.exports = () => {
    const swFile = fs.readFileSync(swOutput);

    fs.writeFileSync(
        swOutput,
        swFile.toString().replace(/\{\{PATH_PREFIX\}\}/g, pathPrefix)
    );

    const manifestFile = fs.readFileSync(manifestOutput);

    fs.writeFileSync(
        manifestOutput,
        manifestFile.toString().replace(/\{\{PATH_PREFIX\}\}/g, pathPrefix)
    );
};
