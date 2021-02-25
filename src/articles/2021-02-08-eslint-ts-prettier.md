---
title: Automate Code Cleanliness in VSCode with Typescript, ESLint, and Prettier
description: I'm a fan of automating this type of thing since I do it in almost every project I ever start up. I just like the autoformatting and clean look of the code too much to go without now (probably says something about my personality).
date: '2021-02-08'
tags: [NodeJS, TypeScript, ESLint, Prettier]
---
## How To Automate Code Cleanliness in VSCode with Typescript, ESLint, and Prettier

I'm a fan of automating this type of thing since I do it in almost every project I ever start up. I just like the autoformatting and clean look of the code too much to go without now (probably says something about my personality :P).

NOTE: If you want a Node.js script that you can run in your repository and automate the entire thing without worrying about the individual pieces, feel free to [skip down to my GitHub Gist at the bottom of this post](#bonus-method---alternate-way-to-script-the-whole-process-with-node.js)!

To do this quickly we're going to use some codegen to get things up and running with `fastify-cli` to quickly generate us a boilerplate Typescript project.

1. `npm i -g fastify-cli`
2. `fastify generate my-repo && cd my-repo && npm i`

You now have a nice boilerplate.  You can read more about fastify at [fastify.io](https://fastify.io) as that's not the point of this writeup.  Now on to the best part!

Run `npm i -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier` to just go ahead and install everything at once.  Keep in mind no matter how you do this you'll have to restart vscode to get the settings to take effect in this repo but the short story here is that all of these packages are pieces of what you need to get this working.  It feels like a lot to me too (every time), that's why I have it written down.

You need a base eslint config file to drive your rule set.  The order of the `extends:` property matters so don't change it unless you know what you're doing.

```bash
echo """
{
    \"parser\": \"@typescript-eslint/parser\",
    \"parserOptions\": {
        \"ecmaVersion\": 2021
    },
    \"extends\": [
        \"eslint:recommended\",
        \"plugin:@typescript-eslint/recommended\",
        \"plugin:prettier/recommended\"
    ]
}
""" > .eslintrc
```

You also need a prettier config file (hey at least the 5 npm packages you installed above get the autoformatting correct _after_ this).

```bash
echo """
{
  \"semi\":  true,
  \"trailingComma\":  \"all\",
  \"singleQuote\":  true
}

""" > .prettierrc
```

I like prettier a certain way and chances are you folks out there do too.  Customize the above generated file however you want!

Install the eslint extension for vscode too.

![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1612230828666/bmF9TKF_t.png)

Lastly we have to change a few settings in VSCode and then restart it.  I always make sure I have these settings set in my workspace settings.json so they override anything else. If everyone on your team doesn't use vscode though you probably want to `.gitignore` that `.vscode/settings.json`.

```bash
mkdir -p .vscode && echo """
{
  \"editor.codeActionsOnSave\": {
    \"source.fixAll\": true
  }
}
""" > .vscode/settings.json
```

And that should do it. Go ahead and restart vscode.  When it starts back up, make sure the eslint and prettier status icons in the bottom right corner don't show any errors:

![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1612231477887/tZ_1Vn7h_.png)

If they do then re-read the above, check that you have everything, and try restarting again.  If you still have no luck, then drop me a message or comment and I'll help you out!

Assuming it worked, go ahead and open any file and notice the magic!  When you save it all gets formatted exactly as you specified in your eslint and prettier configurations (within reason).  Certain things of course aren't capable of being auto-fixed and you'll have to fix them manually.  Overall I consider this setup a huge productivity win in any Typescript codebase.

If you made it this far thanks for reading and happy coding (with wonderful auto-fixing on save) in your future projects.  If you like this article or like my style then check out some of my other work on [this blog](https://jaywolfe.dev/) and [my youtube channel](https://www.youtube.com/channel/UCqUMpLZFrCxXm-qPSa8G08g).


## Bonus Method - Alternate Way To Script the Whole Process With Node.js

<script src="https://gist.github.com/wolfejw86/22a29bd6565fb679959c83c5bc40fea5.js"></script>
