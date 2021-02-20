---
title: TDD A MongoDB and NodeJS API With Integration Tests
description: One thing I find to be a time sink when developing NodeJS APIs is just plain ole getting started...
date: '2021-01-24'
tags: [NodeJS, TypeScript, Koa, Jest, MongoDB]
---

One thing I find to be a time sink when developing NodeJS APIs is just plain ole getting started. There are so many ways to structure a project with Node, many of which are solid. You have to answer questions out of the gate such as:

- Am I going to use es6 classes?

- What NodeJS api framework am I going to use?

- What database am I going to use?

- What does my folder structure look like?

- How am I going to test my app?

- How can I write meaningful integration test when I'm making database calls?

I'm going to walk through my thought process with each step, and hopefully after reading this you can have some examples of how you can walk through your own "startup" process too when starting a new project. I'm going to particularly focus on the last two points - building the project with test driven development and writing meaningful tests around database interactions. If you want to skip straight to the code, you can check it out on [Github here](https://github.com/wolfejw86/blog-examples/tree/master/basic-ts-api). If you want to skip straight to the part where we run integration tests against an in memory mongodb database, skip ahead [to here](#integration-testing-with-mongodb).


First things first, I typically like to use Typescript for well...tons of reasons, but at this point it's honestly faster for me because of the type inference and ability to not have to remember what APIs are available to me on each interface.

- I have my folder for the basic test api - check!

- I installed some dev dependencies - check!

- I made a basic Typescript config with `tsc --init` - check!

- I'm `.gitignore`'ing my `node_modules` and `dist` folder - check!

- I made a `src` and a `test` directory in the root of the project - check!

- I ran `jest --init` and configured my jest file to be geared towards typescript - check!

- I made a basic `app.ts` and `index.ts` server to get started - check!

- I added a `build`, `start`, and `test` script to my package.json - check!

Alright, time to get started building an api!

First things first, I want a bit of design. Let's start small. I want a health-check endpoint to make sure I know when the service is running, and I want an endpoint that will be my main functionality. For this sample project, I've chosen an endpoint that creates and saves my internet speed test results over time, so that I can track my internet speeds from day to day in a time series data visualization.

Next, if we really want to TDD this sucker, we need a testing system in place. I have `jest` installed along with it's specified types, etc. Now lets write our first test in regards to a health-check endpoint. One thing I definitely recommend when building a NodeJS API is to export your app module without starting the server implicitly. While it does "work" if you start the server, there is no need to do this and it adds unnecessary overhead to your testing suite. Also, since we're starting at an integration testing level and _not_ a unit testing level, we're going to skip the basics like "it should return an app", "it should be an instance of Koa", etc. Let's start with, it should return a 200 response from the health check endpoint. Also, don't forget to make your `package.json` scripts for `test:watch` for faster iteration.

(If you're already super familiar with TDD, feel free to skip past the light intro in the next section and jump straight into how we TDD the mongodb interaction)

Up and running with the `test:watch` script I get the following:


![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1611971528379/Wnw3Qnf8W.png)

Exactly what we want! In test driven development, we want to write the test _before_ we write any of the code at all! Since A) we don't have any code for a health route, and B) we didn't do anything for the test so of course it's failing. Let's go ahead and get a bit more specific with our test, then we can start writing code. The way `supertest` works is that it takes a NodeJS `Server` instance and is able to access your route match paths and run the code behind them. It _DOES NOT_ need to be listening. Here's where we can take advantage of that to avoid as many race conditions as possible:

```ts
import http from "http"
import supertest, { SuperTest, Test } from "supertest"
import { setupApp } from "../../app"

let server: http.Server
let request: SuperTest<Test>

beforeAll(() => {
  const app = setupApp()
  server = http.createServer(app.callback())
  request = supertest(server)
})

test("should return a 200 status for /api/health", async () => {
  const response = await request.get("/api/health")

  expect(response.status).toBe(200)
})
```

And now upon saving we get:


![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1611971558148/7_1LHwFPf.png)

And if we change our `app.ts` file from:

```ts
import Koa from "koa"
import Router from "koa-router"

export const setupApp = () => {
  const app = new Koa()

  const router = new Router()

  router.prefix("/api")

  app.use(router.routes()).use(router.allowedMethods())

  return app
}
```

to this (and save the file):

```ts
import Koa from "koa"
import Router from "koa-router"

export const setupApp = () => {
  const app = new Koa()

  const router = new Router()

  router.prefix("/api")

  router.get("/health", ctx => {
    ctx.status = 200
    ctx.body = {
      message: "ok",
      ok: true,
    }
  })

  app.use(router.routes()).use(router.allowedMethods())

  return app
}
```

We should now see:


![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1611971581612/K1Fc1Ldx8.png)

That concludes the very light intro to TDD. Now it's time for why you might really be here, which is to figure out how to TDD against database interactions without having to setup all the mocks, stubs, spies, etc. that are required when testing these interactions in unit tests. DISCLAIMER: I am not saying you don't need unit tests, but sometimes you want higher level tests and don't need to cover every single function in a granular way and instead can start at the integration / interaction level to quickly get coverage, test your interactions, and test that you're getting expected results without having to manually test your endpoints and build complex (insert your API testing tool of choice here) projects.

## Integration Testing with MongoDB

Setting up for recording the result of a speed test, the first thing I want is to test that I get a "created" `201` response from the API when calling my `POST` endpoint. I structured my test like this:

```ts
import http from "http"
import supertest, { SuperTest, Test } from "supertest"
import { setupApp } from "../../app"

let server: http.Server
let request: SuperTest<Test>

beforeAll(() => {
  const app = setupApp()
  server = http.createServer(app.callback())
  request = supertest(server)
})

test("should create a speed test record at /api/speed-test-record", async () => {
  const response = await request.post("/api/speed-test-record")

  expect(response.status).toBe(201)
})
```

And as expected my tests still running in watch mode are failing. Let's get that passing by creating the route and having it return the expected response. It's easy enough to just add

```ts
router.post("/speed-test-record", ctx => {
  ctx.status = 201
})
```

Obviously we're not done. An easy way to setup the test is to expect that that `data` field of the body of the response contains the speed test record we just created. Lets setup an assertion on that as well...wait a second, what data do we want our speed test record to have?? This is a great example of how TDD can help us design our code proactively piece by piece and not waisting un-focused time on just "thinking" about what we're trying to do. Instead we are building our code in tiny chunks, each piece (hopefully) more meaningful than the last. After exploring [Netflix's speedtest API](https://www.fast.com) it looks like I can get just the speed returned as a number in the unit of my choice. Therefore, I'm going to structure my payload like so:

```ts
test("should create a speed test record at /api/speed-test-record", async () => {
  const speedTestResult = {
    speed: 90,
    unit: "mbps",
  }

  const response = await request
    .post("/api/speed-test-record")
    .send({ speed: speedTestResult.speed, unit: speedTestResult.unit })

  const { _id, createdAt, ...apiResponse } = response.body.data

  expect(response.status).toBe(201)
  expect(apiResponse).toEqual(speedTestResult)
})
```

A couple things here as I'm sure you'll notice as soon as you add this, the test fails again due to trying to destructure a property of an undefined response. 1) Yes the ObjectId field of a mongodb document has a timestamp embedded into it, however for ease of access/use I'm going to make an actual `createdAt` field to make it easier to "bucket" this data later(in a later post). 2) I'm going to have a units field separate from my actual result number so that I can easily convert between them if I ever need to. Now it's time to write the logic based code that will help us to make this test pass.

Disclaimer: I don't recommend creating all of these functions inline, however for the purpose of this i'm going to do it all in one function. It's best to add layers to this kind of logic, at a minimum I'd recommend Route Layer -> Controller Layer -> Service Layer, however that's not what this post is about. Back to the task at hand...

We need to accept JSON data for a POST request like this, so let's add body parsing middleware to lighten the load a bit. For this I'm going to use `koa-bodyparser` and `@types/koa-bodyparser` so I get good type inference along with it.

```ts
import bodyParser from "koa-bodyparser"
```

Now using it is as simple as placing it here right after app creation:

```ts
export const setupApp = (db: Db) => {
  const app = new Koa();

  app.use(bodyParser());
```

Now when we send post data to an endpoint in the app, it will be parsed into json and available for use at `ctx.request.body`.

Now we see our test is still failing, but you can drop a `console.warn` in your route to see that at least your data is being sent in. We still have to implement two more things, the database connection and the call to create our document. But how do we run a database while we're running tests??? Like most thing in the NodeJS ecosystem "there's a package for that". `npm install mongodb-memory-server` will give us what we want. I've come across many ways to set it up during a jest testing environment, but the one that has run the most efficiently for me thus far is a bit of a combo. First, I only set it up for a test suite that actually uses it. I've seen it "plugged in" as a `"setupFilesAfterEnv": []` [configuration in the jest config file](https://jestjs.io/docs/en/configuration#setupfilesafterenv-array), however according to the docs, this sets it up for each test suite. That is a lot of processing that I don't really care to wait for on each test. Instead I like to do the following:

- Startup the MongoDB memory server at the top of each test file I need it in

- Connect to it in a `beforeAll` jest hook

- If needed, drop the database I'm testing against between each test in an `afterEach` hook

- Disconnect from it in an `afterAll`

This way I'm only paying the time cost of running it where I need it. Here's the databse setup file I have in mind:

```ts
// setupReplicaSet.ts
import { MongoMemoryReplSet } from "mongodb-memory-server"

export const setupDBConnection = () => {
  let replicaSet: MongoMemoryReplSet

  beforeAll(async () => {
    replicaSet = new MongoMemoryReplSet({
      autoStart: true,
      replSet: {
        name: "rs0",
        dbName: "test_db",
        storageEngine: "wiredTiger",
        count: 1,
      },
    })

    await replicaSet.waitUntilRunning()

    const uri = await replicaSet.getConnectionString()

    global.__MONGO_URI__ = uri
  })

  afterAll(async () => {
    await replicaSet.stop()
  })
}

// global.d.ts
/**
 *
 *  Note: To modify this global object with Typescript in strict mode you will need to add this to the
 * NodeJS module global interface declaration with the following in a `src/types/global.d.ts` file:
 *
 **/
declare module NodeJS {
  interface Global {
    __MONGO_URI__: string
  }
}
```

Walking through the above example, I'm using a function to wrap the following steps:

- start up a replica set in memory `beforeAll` tests for a given file

- wait until it's running

- retrieve the connection string necessary to connect to the replica set

- assign it to the global namespace so that I can access it from anywhere

- `afterAll` the tests for a file run, shut it down

We will plug this function call into the top of our test file soon, we need a couple of other things to go with it first.

- a function that lets us connect to the database with the NodeJS driver

- a way to access the db connection from within our app

To keep it as simple as possible, and use the NodeJS native MongoDB driver, we can do something as simple as this:

```ts
import mongodb from "mongodb"

export const connectDb = async (uri: string) => {
  const client = new mongodb.MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })

  await client.connect()

  const db = client.db("speed_test")

  const disconnect = () => client.close()

  return {
    db,
    disconnect,
  }
}
```

All we need is a connection string and we can connect to a database with the MongoClient, and also return 2 things, the instance of the database connection, and a way to disconnect it at a later time if we need to (which we will).

If we change the top of our test file to this, we should notice it takes a bit longer to run, although it still fails for the same reasons:

```ts
let server: http.Server
let request: SuperTest<Test>
let disconnect: () => Promise<void>

setupDBConnection()

beforeAll(async () => {
  const dbConnection = await connectDb(global.__MONGO_URI__)
  disconnect = dbConnection.disconnect

  const app = setupApp()

  server = http.createServer(app.callback())
  request = supertest(server)
})

afterAll(async () => {
  await disconnect()
})
```

Now however, before all the tests, we're standing up a replica set in memory, connecting to it with the MongoDB driver, and then after all the tests we're disconnecting from it. Pretty cool! Finally we're ready to do something with it by writing code to satisfy our test case. I left it off in this state to see things at least running somewhat:

```ts
router.post("/speed-test-record", async ctx => {
  const { speed, unit } = ctx.request.body
  console.warn({ speed, unit })

  ctx.status = 201
  ctx.body = {}
})
```

And is now yielding At least we got something going right?:

![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1611971647328/M7h0hYgLS.png)

If we pass our connected database instance into our setup app function, then we can use it in our route. To keep it simple, I'm going to change index.ts to this:

```ts
import http from "http"
import { setupApp } from "./app"
import { connectDb } from "./db"

const port = process.env.PORT || 3000

const main = async () => {
  const { db } = await connectDb(
    process.env.MONGO_URI || "mongodb://localhost/speed_test"
  )
  const app = setupApp(db)

  http.createServer(app.callback()).listen(port, async () => {
    console.log(
      `App listening on port ${port} @ ${new Date().toLocaleString()}`
    )
  })
}

main()
```

With the above slight refactor, I can run my actual app with it connected to a localhost mongodb database like I'm used to. The difference here is that I have a loose coupling of the database connection and setting up the app, which allows me to use the test instance database connection in it's place! Don't forget to change the app.ts file to this:

```ts
import { Db } from "mongodb";

export type SpeedTestUnits = "bps" | "kbps" | "mbps" | "gbps";

export const setupApp = (db: Db) => {
```

You'll notice semantically I typed out a [union type](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types) for the different units I want to use when storing the results of the speed test. For this level of demonstration it's not a huge bonus, but I think semantically it makes sense to use a union type here since we want to restrict what can be used as this value in our Typescript build step. Since we're currently expecting to take two values from the POST request and save them in the database, it's time to do our active database connection to do so:

```ts
router.post("/speed-test-record", async ctx => {
  const { speed, unit } = ctx.request.body

  const record = await db.collection("speed_test_records").insertOne({
    speed,
    unit,
    createdAt: new Date(),
  })

  ctx.status = 201
  ctx.body = {}
})
```

This creates the collection `speed_test_records` if it doesn't exist, and attempts to insert. Notice after we save our test still isn't passing. That's because we're expecting to get the returned response to equal what we just inserted into the db. I think it's also worth noting that semantically it might not make sense for you to return the object you just created in the database back to whatever is calling the endpoint. You'll have to make that decision for your own API that your building. For now, I'm happy with it, and it also happens to demonstrate my purpose here nicely. Once we change it to the below and save, our test should pass:

```ts
router.post("/speed-test-record", async ctx => {
  const { speed, unit } = ctx.request.body

  const record = await db.collection("speed_test_records").insertOne({
    speed,
    unit,
    createdAt: new Date(),
  })

  ctx.status = 201
  ctx.body = {
    data: record.ops[0],
  }
})
```

Oh wait! It's still failing (and you may have caught this before reading it, if you did, nice work!). We have changed the dependencies of our `setupApp` function and need to adjust the top of our test file to accommodate it as well. See:

```ts
let server: http.Server
let request: SuperTest<Test>
let db: Db
let disconnect: () => Promise<void>

setupDBConnection()

beforeAll(async () => {
  const dbConnection = await connectDb(global.__MONGO_URI__)
  db = dbConnection.db
  disconnect = dbConnection.disconnect

  const app = setupApp(db)

  server = http.createServer(app.callback())
  request = supertest(server)
})

afterAll(async () => {
  await disconnect()
})
```

And that's it! Beautiful green check marks and decent coverage across the board. This tends to be the flow of TDD. Write a test case, write some code to make it pass, tweak any added setup / dependencies in the test runner, rinse and repeat. After you get it passing, that's when it becomes really easy to refactor to separate your concerns a bit more. The thing to remember is, your test should always pass, and as soon as it doesn't, you'll know you refactored a bit too much and need to take a step back! Also, if you made it this far, thanks for reading! As always, you can check out the code here: [https://github.com/wolfejw86/blog-examples/tree/master/basic-ts-api](https://github.com/wolfejw86/blog-examples/tree/master/basic-ts-api)

Also as a final shameless plug, if you like my style or the way I present things, check out my series on YouTube where I walk through creating a Fastify + Postgres API with automatic Swagger documentation and applied Test Driven Development practice here: https://youtube.com/playlist?list=PLU_22oKqONin7yagFMm3x1tJihYaIVVwa
