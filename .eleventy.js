const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const modifyAppPrefixIfExists = require("./src/scripts/tasks/overwrite_path_prefix");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const timeToRead = require("eleventy-plugin-time-to-read");
const chunk = require("lodash.chunk");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = (config) => {
    config.setDataDeepMerge(true); // allows root .json file for data groupings + individual tags at the frontmatter level
    // Needed to prevent eleventy from ignoring changes to generated
    // templates since it is in our `.gitignore`
    config.setUseGitIgnore(false);

    // Pass-through files
    config.addPassthroughCopy({ "src/assets/public": "/" });
    config.addPassthroughCopy({ "src/scripts/utilities/sw.js": "sw.js" });
    config.addPassthroughCopy("src/assets/files");
    config.addPassthroughCopy("src/assets/images");
    config.addPassthroughCopy("src/assets/videos");
    config.setLibrary(
        "md",
        require("markdown-it")("commonmark")
            .use(require("markdown-it-attrs"))
            .use(require("markdown-it-anchor"), {
                permalink: true,
                permalinkClass: "direct-link a-anchor m-navigation__link",
                permalinkBefore: true,
                permalinkSymbol: "#",
            })
    );

    config.addPlugin(timeToRead, { style: "short" });

    global.filters = config.javascriptFunctions; // magic happens here
    config.setPugOptions({
        // and here
        globals: ["filters"],
    });
    global.filters.json = (o) => JSON.stringify(o);

    config.addPlugin(sitemap, {
        sitemap: {
            hostname:
                process.env.ELEVENTY_SITEMAP_BASE_URL ||
                "http://localhost:3000",
        },
    });

    // Syntax highlighting on Markdown
    config.addPlugin(syntaxHighlight, {
        // Change which syntax highlighters are installed
        templateFormats: ["*"], // default

        // Or, just njk and md syntax highlighters (do not install liquid)
        // templateFormats: ["njk", "md"],

        // init callback lets you customize Prism
        init: function ({ Prism }) {
            Prism.languages.myCustomLanguage = "";
        },

        // Added in 3.0, set to true to always wrap lines in `<span class="highlight-line">`
        // The default (false) only wraps when line numbers are passed in.
        alwaysWrapLineHighlights: true,

        // Added in 3.0.2, set to false to opt-out of pre-highlight removal of leading
        // and trailing whitespace
        trim: true,

        // Added in 3.0.4, change the separator between lines (you may want "\n")
        lineSeparator: "<br>",
    });

    config.on("afterBuild", () => {
        modifyAppPrefixIfExists();
    });

    // Strip HTML
    config.addFilter("stripHtml", (content) => {
        const strippedContent = content
            .replace(/(<([^>]+)>)/gi, "")
            .replace(/\r?\n|\r/gi, " ")
            .trim();
        return strippedContent;
    });

    config.addCollection("tagList", function (collection) {
        const tagSet = new Set();
        collection.getAll().forEach(function (item) {
            if ("tags" in item.data) {
                let tags = item.data.tags;

                tags = tags.filter(function (item) {
                    switch (item) {
                        case "posts":
                            return false;
                    }

                    return true;
                });

                for (const tag of tags) {
                    tagSet.add(tag);
                }
            }
        });

        return [...tagSet];
    });

    // Categorize contents
    config.addCollection("categories", (collection) => {
        // Get unique list of tags
        let tagSet = new Set();
        collection.getAllSorted().map((item) => {
            if ("tags" in item.data) {
                const tags = item.data.tags;
                // Optionally filter things out before you iterate over.
                for (let tag of tags) {
                    tagSet.add(tag);
                }
            }
        });

        const paginationSize = 5;
        const tagMap = [];
        const tagArray = [...tagSet];

        for (let tagName of tagArray) {
            const tagItems = collection.getFilteredByTag(tagName);
            const tagItemsWithPrevAndNext = tagItems.map(
                (tagItem, index, thisArray) => {
                    const prev = thisArray[index - 1];
                    const next = thisArray[index + 1];
                    tagItem.data["prev"] = {
                        ...tagItem.data["prev"],
                        [tagName]: prev,
                    };
                    tagItem.data["next"] = {
                        ...tagItem.data["next"],
                        [tagName]: next,
                    };

                    return tagItem;
                }
            );

            const pagedItems = chunk(tagItemsWithPrevAndNext, paginationSize);
            pagedItems.forEach((pagedItem, index) => {
                tagMap.push({
                    tagName,
                    pageNumber: index,
                    pageData: pagedItem,
                });
            });
        }

        return tagMap;
    });
    config.addPlugin(pluginRss);
    config.addLiquidFilter("dateToRfc3339", pluginRss.dateRfc3339);
    config.addFilter("prettyDate", function prettyDate(dateString) {
        //if it's already a date object and not a string you don't need this line:
        var date = new Date(dateString);
        var d = date.getDate();
        var monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        var m = monthNames[date.getMonth()];
        var y = date.getFullYear();
        return m + " " + d + ", " + y;
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            layouts: "_includes/templates",
            includes: "_includes",
        },
        templateFormats: ["md", "pug", "njk"],
        htmlTemplateEngine: "pug",
        pathPrefix: process.env.ELEVENTY_PATH_PREFIX,
    };
};
