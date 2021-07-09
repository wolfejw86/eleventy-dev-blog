const fs = require("fs");

const articleName = process.argv[2];
const force = process.argv[3];
const date = new Date();
const month =
    date.getMonth() + 1 > 9 ? date.getMonth() : `0${date.getMonth() + 1}`;
const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
const fullDate = `${date.getFullYear()}-${month}-${day}`;
const filename = `${fullDate}-${articleName}.md`;
const filepath = require("path").join(__dirname, "src/articles", filename);

if (fs.existsSync(filepath) && !force) {
    console.log(
        `Blog article ${filename} already exists.  Run command again with --force at the end to force overwrite.`
    );
}

fs.writeFileSync(
    filepath,
    `---
title: ${articleName}
description: ${articleName}
date: "${fullDate}"
tags: []
---

## {{ title }}

{{ description }}
`
);
