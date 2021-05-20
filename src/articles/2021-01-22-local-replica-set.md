---
title: Run a MongoDB Replica Set in Seconds
description: Run A MongoDB Replica Set Locally
date: "2021-01-18"
tags: [MongoDB]
---

## Run a MongoDB Replica Set in Seconds

- You’re like me and want to know how it works! (and more important play around with it locally)
- The application you’re building has a requirement to use change streams
- The application you’re building has a requirement to use transactions
- You want to learn how either of the above 2 features work without having to deploy a database to the cloud

The truth is, any of the above or something completely different are all fine reasons to want to learn something new. That's what this industry is all about and personally one of the reasons I enjoy it so much.

## The MongoDB Installation Way

Windows - Mac - Linux - It used to be more of a separated installation, perhaps you’re used to using something like Chocolatey on Windows or Homebrew on a Mac. I would no longer recommend those installation methods and instead, opt to just install from the MongoDB Manual Documentation

Once it’s installed, make sure that it isn’t running in the background. If it’s already running, then you can’t start it as a replica set. If you want to double check you can run `mongo` and see if the mongo CLI utility auto connects. If it connects, you already have something running and need to shut it down by doing the following:

Connect to it with mongo cli:

`mongo --eval "db.getSiblingDB('admin').shutdownServer()"`

Now that we can start fresh, make sure your data directory is setup properly. I am on a mac and have it set to /data/db. You’ll need to do the same (or equivalent) on your machine.

Now we can start our replica set. It’s actually a really simple one liner:

`mongod --port 27017 --dbpath /data/db --replSet rs0 --bind_ip localhost`

## Problems with this step? Check this list here:

- I am having trouble with /data/db, I either can't create the directory or I can't figure out how to change it from readonly permissions
  - solution: You can google about filesystem permissions and `chmod 777` and all that, however I recommend a simpler fix. Just create a directory somewhere easily accessible that you know you have write permissions on your file system for. I personally like to use `mkdir -p ~/Desktop/data/db` (on a mac) or do the equivalent new folder on windows. The point is it's somewhere you are allowed to create and manipulate files. Now, change the above command to `mongod --port 27017 --dbpath ~/Desktop/data/db --replSet rs0 --bind_ip localhost`. That was easy right? All we did was specify a different directory for the mongod process to read and write the database files to and from.

![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1612629148867/BnBeMuUy8.png)

That’s it! Now obviously you could do a lot more in terms of binding more nodes, etc. but if you’re reading this, you were probably just looking for an easy way to get started and here it is. You have to do just one more step to actually turn on your replica set. Connect to mongo CLI again and run:

`rs.initiate()`

There you have it. You should see some configuration output and you should see activity in your mongod terminal.

![image.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1612629177806/eQV8sxZBm.png)

Now I can easily develop locally simulating the full feature set of a mongodb replica set.

If you're like me and don't want to keep a list of unnecessary long commands lying around, try aliasing it. You don't have to run `rs.initiate()` except for the very first time.

## The Docker Compose Way

The docker way (especially locally) is a bit more convoluted, however can be really useful for building containerized apps that communicate over dynamic DNS. It's also extremely useful for running multiple different versions of MongoDB Replica Sets for different projects. You can store each respective replica set's data volume wherever you want, thus having multiple different replica sets on your machine organized the way you want. We’re going to need two files, one for our `docker-compose.yml` and one for our replica set setup script.

Here is our compose file:

```yml
version: "3"
services:
  mongo1:
    hostname: mongo1
    container_name: localmongo1
    image: mongo:4.0 #you can change this to whatever version you want
    ports:
      - "27017:27017"
    expose:
      - 27017
    restart: always
    entrypoint: ["/usr/bin/mongod", "--bind_ip_all", "--replSet", "rs0"]

  mongo2:
    hostname: mongo2
    container_name: localmongo2
    image: mongo:4.0
    expose:
      - 27017
    restart: always
    entrypoint: ["/usr/bin/mongod", "--bind_ip_all", "--replSet", "rs0"]

  mongo3:
    hostname: mongo3
    container_name: localmongo3
    image: mongo:4.0
    expose:
      - 27017
    restart: always
    entrypoint: ["/usr/bin/mongod", "--bind_ip_all", "--replSet", "rs0"]

  mongosetup:
    image: mongo:4.0
    links:
      - mongo1:mongo1
      - mongo2:mongo2
      - mongo3:mongo3
    depends_on:
      - mongo1
      - mongo2
      - mongo3
    volumes:
      - ./scripts:/scripts
      - ./data/db:/data/db
    restart: "no"
    entrypoint: ["bash", "/scripts/mongo_setup.sh"]
```

We start three different mongod processes all linked together, and then create an additional 4th service in our compose file that essentially just runs a bash file with its entrypoint.

```bash
sleep 10

echo SETUP.sh time now: `date +"%T" `
mongo --host mongo1:27017 <<EOF
  var cfg = {
    "_id": "rs0",
    "version": 1,
    "members": [
      {
        "_id": 0,
        "host": "mongo1:27017",
        "priority": 2
      },
      {
        "_id": 1,
        "host": "mongo2:27017",
        "priority": 0
      },
      {
        "_id": 2,
        "host": "mongo3:27017",
        "priority": 0
      }
    ]
  };
  rs.initiate(cfg, { force: true });
  rs.reconfig(cfg, { force: true });
  db.getMongo().setReadPref('nearest');
EOF
```

The bash file is relatively straightforward mongo syntax, which you can read about at [MongoDB's documentation page](https://docs.mongodb.com/manual/reference/replica-configuration/). It is basically initiating the replica set with each member node that we are running in the docker-compose file.

Once the bash file runs, the replica set is initiated and after a few moments the replica set is ready. It’s important to note that this takes some time, and the application will either need to handle the database not being ready right away or not even start up until the database is ready. The best way I’ve found to do this is to run the replica set separately from the app you’re developing, in which case you may be better off just using the installation method above.

I wrapped all the compose setup and info into a repo so you can skip straight to the code. I also wrote a small node file that creates events and listens to a change stream (to prove that the replica set is running locally).

If you want to skip straight to the repo, you can clone it here - [https://github.com/wolfejw86/local-replica-set](https://github.com/wolfejw86/local-replica-set), run `docker-compose up`, and it should just work.

If you made it this far, thanks for reading! I hope you found this helpful. If you'd like to see more like this or something else entirely, drop me a comment and let me know what you'd like to see. Happy coding!
