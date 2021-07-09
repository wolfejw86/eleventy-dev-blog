---
title: Setup A Fastify App with Jest Tests the Right Way
description: If you've ever used the fastify-cli to generate a new fastify app only to find out it uses a package called "tap" to write your tests, you might have been dissappoined.  I also shared this dissappointment.  While there are many good reasons to use `tap` instead of `jest` for your tests in your fastify app, it may be more than you're trying to "bite off" when first learning the fastify ecosystem.  If this sounds similar to your experience, then look no further - I have you covered.  Setup Jest tests in a brand new Fastify app the right way with this short guide.
date: "2021-07-08"
tags: [Fastify, Node.js, Jest, TypeScript]
---

## Setup A Fastify App with Jest Tests the Right Way ⚡️

{{description}}

_By the way, if you prefer video tutorials or jumping straight into the code examples yourself, check them out here:_

[Video Tutorial of this Article](https://www.youtube.com/watch?v=beY0sn-XgtY)

[GitHub Code](https://github.com/wolfejw86/blog-examples/tree/master/fastify-jest-example)

## Get Going With A Fastify App

A quick run of the following will get you running with a new fastify app:

```bash
npm i -g fastify-cli;
fastify generate fastify-setup-with-jest --lang=ts;
cd fastify-setup-with-jest && npm i;
```

That should get you a standard fastify typescript boilerplate app. We'll take on the next steps a couple at a time.

## Getting Jest Dependencies

Even though right now we have a starter app with `tap` tests, we can pretty quickly swap `tap` out for `jest`. First lets get those jest dependencies installed:

```bash
npm i jest ts-jest @types/jest;
npx ts-jest config:init;
```

This should get you setup with required jest dependencies and a simple jest config file to allow running your tests with `ts-jest` and typescript. Now all we need to do is complete a slight refactor of our `tap` formatted tests and we're done!

## Swapping Tap for Jest - Test Setup

You'll notice we have integration tests - tests that actually "call" our endpoints within our fastify app via `fastify.inject`. These can be accommodated via a simple refactor to the `helper.ts` file. We just need to use jest lifecycle methods instead.

```ts
// helper.ts

import Fastify from "fastify";
import fp from "fastify-plugin";
import App from "../src/app";

export function build() {
  const app = Fastify();

  beforeAll(async () => {
    void app.register(fp(App));
    await app.ready();
  });

  afterAll(() => app.close());

  return app;
}
```

Notice how we have a synchronous function that returns a fastify app instance while we can use `jest`'s asynchronous lifecycle functions `beforeAll` and `afterAll` to register our app and it's plugin dependencies and wait for everything to be ready. This way we can get the fastify app instance within our test file `describe` blocks without having to actually do any asynchronous work, or messy `let` declarations with re-assignments. It's simply much cleaner this way.

We can also use the `afterAll` hook to correctly shutdown the fastify instance. One last point of note - we don't actually need to call `.listen()` on the app instance thanks to the excellent API provided by fastify's core method `fastify.inject` which we'll see in our test files.

Now that we have the main way to instantiate our fastify server for integration tests the "jest" way, we can refactor our actual tests!

## Refactoring the Tests

When refactoring all of the existing tests, the changes we have to make fall into one of three categories.

<br>
<br>

#### Removing import references to `tap` like the following:

```ts
import { test } from "tap";
```

<br>
<br>

#### Removing the `t` parameter from the `test` function callbacks:

```ts
test("default root route", async (t) => {
```

_This is actually paramount - if you don't do this then `jest` will think you've used [the done callback style of test](https://jestjs.io/docs/asynchronous#callbacks) and your tests will timeout. If you accidentally do this without realizing it will be hard to debug. Ask me how I know 😉._

<br>
<br>

#### Updating the `t` based assertions to normal `jest` assertions:

From:

```ts
t.same(JSON.parse(res.payload), { root: true });
```

To:

```ts
expect(res.json()).toEqual({ root: true });
```

<br>
<br>

Lastly, since most of your test files only have one test, you'll see that the "testing" version of the fastify app (think back to our `build()` function from our `helpers.ts` file) gets instantiated within the `test` function blocks directly like so:

```ts
import { build } from "../helper";

test("default root route", async () => {
  const app = build();
  const res = await app.inject({
    url: "/",
  });
  expect(res.json()).toEqual({ root: true });
});
```

This will work fine when there's only one test, however if you have multiple tests per file, re-instantiating the "testing" version of the fastify server is an expensive operation. You can re-use the existing test app instance by doing the following:

```ts
import { build } from "../helper";

const app = build();

test("default root route", async () => {
  const res = await app.inject({
    url: "/",
  });
  expect(res.json()).toEqual({ root: true });
});

test("some other root test", async () => {
  const res = await app.inject({ url: "/root2" });

  expect(res.json()).toEqual({ root2: true });
});
```

Simple as that! Now you can write multiple tests per file against your "test bed" version of your fastify app with really clean and simple syntax.

## Conclusion

Thanks for tuning in, I hope you found this technique as helpful as I did. If you're interested in a video tutorial version of this article, check out my video walkthrough of this technique here:

[Video Tutorial of this Article](https://www.youtube.com/watch?v=beY0sn-XgtY)

[GitHub Code](https://github.com/wolfejw86/blog-examples/tree/master/fastify-jest-example)
