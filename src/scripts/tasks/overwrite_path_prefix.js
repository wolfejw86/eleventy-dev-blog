const fs = require("fs");
const path = require("path");
const glob = require("glob");

module.exports = () => {
    const siteRoot = process.env.SITE_ROOT || "http://localhost:1992/"
    const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";
    const basePath = path.join(__dirname, "../../../_site");
    const filesToCheck = glob.sync("*.{js,webmanifest,txt}", { cwd: basePath });

    console.log({ basePath, filesToCheck });

    filesToCheck.forEach((file) => {
        const inputOutput = `${basePath}/${file}`;
        console.log(inputOutput);
        const content = fs.readFileSync(inputOutput);
        fs.writeFileSync(
            inputOutput,
            content.toString().replace(/\{\{PATH_PREFIX\}\}/g, pathPrefix).replace(/\{\{SITE_ROOT\}\}/g, siteRoot)
        );
    });
};
