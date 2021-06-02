---
title: Setup Your Fastify Server With Logging The Right Way - No More Express
description: Learning a new Node.js framework can be daunting given the speed at which the ecosystem moves these days. Also some of the information on learning new techniques with Node.js is outdated - for example the sheer number of Express tutorials you still find out there! Express is long overdue for a replacement, and Fastify fits right in!  One of the first things to consider when running a Node.js server is how to handle logging the right way. ExpressJS did not offer anything out of the box, forcing another bike shed to paint amongst your team.  Fastify on the other hand recognizes that this is a critical piece of running a server and provides sensible defaults - in the case of logging - the pino logger. Join me in this article where I walk through how to setup a Fastify Node.js logger the right way, the first time.
date: "2021-05-31"
tags: [Fastify, Node.js]
published: true
---

## {{ title }}

{{ description }}

P.S. If you want to jump straight to the GitHub code example, scroll no further and head right over here: [PlaceHolder](#github)

### A New Fastify Server in a Single .js File

First things first, you need a way to experiment! Learning new things can be challenging so setting yourself up for success is really important. For the duration of this article I'd recommend using the below single file fastify server

```js
const Fastify = require("fastify");
const server = Fastify({});

server.listen(3000, (err) => {
  server.log.info("Server listening...");
});
```

### Setting Up The Logger Correctly

Fastify uses the [pino](https://getpino.io/) logging package under the hood. It is leaps and bounds ahead of pretty much all other Node.js loggers out there in my opinion. It has high performance, excellent configurability, and great sensible defaults that instantly put you in the "pit of success" when using it. If you want to start off with that "sensible" configuration, all you have to do is this in your fastify server's config:

```js
const Fastify = require("fastify");
const server = Fastify({
  logger: true, // default is false https://www.fastify.io/docs/latest/Server/#logger
});

server.listen(3000, (err) => {
  server.log.info("Server listening...");
});
```

I really like the idea of sensible defaults, however it can still be a bit of overhead to figure out what they are and how they work. Here's what you get by just putting `logger: true`:

- easily accessed logger functions - ie `fastify.log.info(...args)` | `fastify.log.error(...args)` - also available as `request.log.info(...args)` decorated on each request
- fast JSON string logging with built in request id generation and attachment to all logs "in between" requests/responses which formats great for integrations with kibana/elastic search or splunk (or name your centralize logging solution that "likes" to ingest JSON formatted strings)
- automatic request id attachment to any logs that happen in between the request/response log

Example:

1. user A's client makes a request to the fastify backend - we get a logged incoming request with a request id
2. user A's request makes it through, but our db query threw an error
3. we logged that error using `fastify.log.error` - this automatically attaches that request id to this error log
4. Now when we get alerted that something went wrong with this user's request we see:

- `{ requestId: 999, url: "/my-endpoint-that-error's", sessionId: "session-123" }`
- `{ requestId: 999, message: "my helpful database related error message", sessionId: "session-123" }`
- `{ requestId: 999, statusCode: 500, duration: 150, sessionId: "session-123" }`

  You can see in a central logging system it would be easy to "correlate" the error with that user's request. Additionally you can modify the request/response logs that happen on each request to fit your use case - often times a client tracing id or a session id can add further debugging capabilities to your log stream.

  ### Incremental Improvements - Better Log Correlation

  The first thing that catches my eye above is that the `url` is only logged on the first log message while the `duration` of the request is only logged at the end. While this makes logical sense, if you're making a dashboard from your logstream with your API endpoints and their average response times, correlating these inside of another tool can be quite frustrating. This is a great time to break out of the default mode and simply implement your own request/response logging.

  The high level process to achieve this type of custom request/response logging would be to [disable the default request logging and replace it with your custom implementation](https://www.fastify.io/docs/v3.15.x/Server/#disablerequestlogging) to get the granular data inside the logs you need on each request.

  This will be a very common thing to do and should not be thought of as overly "risky" or "advanced":

  ```js
  const Fastify = require("fastify");
  const server = Fastify({
    logger: true,
    disableRequestLogging: true,
  });

  const now = () => Date.now();

  server.addHook("onRequest", (req, reply, done) => {
    reply.startTime = now();
    req.log.info({ url: req.raw.url, id: req.id }, "received request");
    done();
  });

  server.addHook("onResponse", (req, reply, done) => {
    req.log.info(
      {
        url: req.raw.url, // add url to response as well for simple correlating
        statusCode: reply.raw.statusCode,
        durationMs: now() - reply.startTime, // recreate duration in ms - use process.hrtime() - https://nodejs.org/api/process.html#process_process_hrtime_bigint for most accuracy
      },
      "request completed"
    );
    done();
  });

  server.get("/hello", () => ({ ok: true }));

  server.listen(4000, (err) => {
    server.log.info("Server listening...");
  });
  ```

  After the above re-implementation of request/response logging you'll be able to correlate your API urls more easily with the response times.

  ### Incremental Improvements - Better Request-Id Generation

  The second thing I notice is that `requestId`'s are generated based off of using autoincrementing integers. While this works great if you only have one server, in a world of containers and horizontal autoscaling this doesn't go very far as you'll get collisions which will hurt your logging accuracy and your ability to debug your log tracing. It is however really easy to override the default behavior:

  ```js
  const Fastify = require("fastify");
  const uuidv4 = require("uuid").v4;
  const server = Fastify({
    logger: true,
    genReqId(req) {
      // you get access to the req here if you need it - must be a synchronous function
      return uuidv4();
    },
  });

  server.listen(3000, (err) => {
    server.log.info("Server listening...");
  });
  ```

Now with our logger and our `genReqId()` implementation we will have a uuid generated for each request-id - algorithmically guaranteed to be unique!

WARNING: [There is a caveat for request-id generation with some additional default behavior](https://www.fastify.io/docs/v3.15.x/Server/#requestidheader). It is also common in distributed systems to use a client-based request-id to correlate downstream API requests. Fastify supports this out of the box, however you need to know it's there. Normally with something like [OpenTelemetry](https://opentelemetry.io/) you would have a request-id as well as span id's. OpenTelemetry is out of scope for this article, however just know that there is a default behavior that can allow a client sending trace ids as a header (default `request-id`) is supported. In this case, you would want to work out this contract with your consumers ahead of time and potentially put something in place to ensure they adhere to this practice.

### Security

One excellent built in feature is [the ability to redact sensitive information with pinojs](https://getpino.io/#/docs/redaction?id=redaction). The fastify server's logger configuration is just a pass-through for pino so you can use all its features. If I know for example that I have a logger that will log sensitive information, I can easily redact it using string paths:

```js
const Fastify = require("fastify");
const server = Fastify({
  logger: {
    redact: ["headers.authorization"],
    // an object for redact is also supported - see the docs https://getpino.io/#/docs/redaction?id=redaction
    // redact: {
    //   paths: ["headers.authorization"],
    //   remove: true,
    //   censor: "Super Secret!!",
    // },
    level: "info",
  },
});

server.get("/", async (req) => {
  req.log.info(
    { headers: req.headers },
    "Logging request headers for debugging..."
  );

  return { ok: true };
});

server.listen(3000, (err) => {
  server.log.info("Server listening...");

  // console.log used here only to log out a pre-baked curl request for you to make this example easy
  console.log(`
  # Try a curl request with sensitive info as the auth header and watch it NOT get logged:
  curl http://localhost:3000 -H "Authorization: Bearer my-secret-token-that-will-not-get-logged" -H "X-Will-Get-Logged: This header will still get logged"
  `);
});
```

If you run the code example above - try running the built in curl request that gets logged out. You should see that the `authorization` header got redacted while the other header still showed up:

```json
{
  "level": 30,
  "time": 1622597119730,
  "pid": 98721,
  "reqId": "req-1",
  "headers": {
    "host": "localhost:3000",
    "user-agent": "curl/7.64.1",
    "accept": "*/*",
    "authorization": "[Redacted]", // notice that it got redacted - you can customize this too
    "x-will-get-logged": "This header will still get logged"
  },
  "msg": "Logging request headers for debugging..."
}
```

### Wrap Up

This is really it - thankfully like most things with Fastify - logging is really simple to implement, even for the most complex of use cases. If you have a need for a larger abstraction to help prevent churn with log formatting, application specific static logging, and even the dreaded framework swap, it can be recommended to instantiate the logger separately rather than just passing the fastify server `{ logging: true }`. Great news - you can easily bring your own logger. This is actually what I do for most of my larger projects at work. As long as it adheres to the logging interface (ie has a `.info, .warn, .error, etc.`) it will pretty much just work. For what it's worth even if you bring your own logging solution I highly recommend using pino as it's the fastest logger in town. To bring your own logger (pino) as an example, simply do this:

```js
const logger = require("pino")({
  name: "my-application-name", // this will add `name` to every logged object
  // Check out the full list of pino options here:
  // https://getpino.io/#/docs/api?id=options
});
const Fastify = require("fastify");
const server = Fastify({ logger }); // simply pass your pino instance to the fastify config

server.listen(3000, () => {
  server.log.info("Server listening...");
});
```

<!-- ### Tracing Your Requests Easily

- augment built in request tracing
- customize the request-id
- figure out what happened!

### I need the user's ip address for ~tracking~ anti-fraud purposes! Halp!

- what does `trustProxy` do?
- when does it matter?

### Defaults That _Can_ Be Pitfalls

- caseSensitive
- bodyLimit
- ignoreTrailingSlash
- connectionTimeout
- pluginTimeout

### The Fastify Server Lifecycle and Why You Should Care

- register
- after
- ready
- listen
- close (plust a plug to gracefully close it)

### Debugging the Running Server

- printRoutes
- printPlugins -->

### References

1. [Fastify Docs Site](https://www.fastify.io/docs/v3.15.x/)

2. [Pino Docs Site](https://getpino.io/)
