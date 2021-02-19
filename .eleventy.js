const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const modifyAppPrefixIfExists = require('./src/scripts/tasks/overwrite_path_prefix');

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
        require("markdown-it")("commonmark").use(require("markdown-it-attrs"))
    );
    global.filters = config.javascriptFunctions; // magic happens here
    config.setPugOptions({
        // and here
        globals: ["filters"],
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

    config.addCollection('tagList', function (collection) {
        const tagSet = new Set();
        collection.getAll().forEach(function (item) {
          if ('tags' in item.data) {
            let tags = item.data.tags;

            tags = tags.filter(function (item) {
              switch (item) {
                case 'posts':
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

    return {
        dir: {
            input: "src",
            output: "_site",
            layouts: "_includes/templates",
            includes: "_includes",
        },
        templateFormats: ["md"],
        htmlTemplateEngine: "pug",
        pathPrefix: process.env.ELEVENTY_PATH_PREFIX,
    };
};
