---
title: How I Quickly Create Static Website Hosting Using Only an AWS s3 Bucket
description: I'm a fan of automating this type of thing since I do it in almost every project I ever start up. I just like the autoformatting and clean look of the code too much to go without now (probably says something about my personality).
date: '2021-02-20'
tags: [AWS, NodeJS, EleventyJS]
---

## How To Use s3 for Static Website Hosting In A Nutshell
Today's post is going to be short - if you want to get the bash script I wrote right away so that you can scale up an s3 bucket to host your static website feel free to do so by  [clicking here](#just-give-me-the-script-please)  to jump to the bottom.

So today I just needed to get something put together really quickly.  I'm playing around with the EleventyJS static site generator and wanted to test my deployments quickly and easily, as well as prove out a possible avenue of long term deployment options with https, ssl, etc. etc. you know the drill.  It turns out the way to do that in AWS land is to use an s3 bucket.  Simple enough right? More like maybe...

I found an abundance of tutorials painstakingly walking me through the complexity of the AWS Console UI and I quickly got frustrated! I'm a developer! I don't need a UI! I have a perfectly good terminal.

## Get Something Up And Running

If you need a static site to play around with to deploy to s3 hosting why not  [clone the eleventy blog starter here](https://github.com/11ty/eleventy-base-blog)  - it's quick and easy to install (assuming you're a NodeJS developer.  Even if you're not -  [installing NodeJS is pretty trivial these days](https://nodejs.org/en/download/)).

Once you have a static site to work with locally, make sure to build the static assets.  In the example repo I reference above you can just use `npm run build` which will output your complete static site to the `_site` directory in the repo.  That's what I'm going to assume you have - a `_site` folder at the same directory you're about to run my handy dandy bash script.  (You could easily swap it out with a `build` folder resulting from a `create-react-app` output or other similar frontend framework static asset build result).

## Uh Oh - You Need The AWS CLI

I've heard of folks having trouble installing the AWS CLI in the past.  Knock on wood I've never had that problem and hope it stays that way.  You will need it for this script to work, along with your AWS credentials setup for your machine correctly.

 [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

 [How To Configure the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

## What Commands Do I Have To Run?

Okay here we go - bash scripting goodness for the win!  Assuming you have a static site, AWS cli, and your local AWS credentials configured correctly, you should be able to run each of these commands without issue.

First we need a name for our new s3 bucket we're about to create! Even when scripting with bash it can be helpful to keep our code DRY.  Therefore we'll use a simple variable throughout our operations - `BUCKET_NAME`.

```bash
export BUCKET_NAME=mys3bucketname
```
Now, time to create that bucket:
```bash
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1
```
Assuming that worked you should now have a bucket in your console!  You will also get some output letting you know it worked.

Next, upload that static site by running the sync command.  This ensures everything in the s3 bucket (you can think of it like a folder almost) is 1-1 in sync with the `_site` folder on your local machine. Handy right? Bonus points - it works nicely in a CI environment as well!
```bash
aws s3 sync ./_site s3://$BUCKET_NAME
```
Now if you click around in the console and look at your bucket you'll see your files there.


Time to specify what our entry and error pages for our site are while setting up the bucket's permissions as a public site.
```bash
aws s3 website s3://$BUCKET_NAME  --index-document index.html --error-document 404.html
```
NOTE: These filenames are specific to EleventyJS.  While they're common, yours may be named something different or you may not have a 404.html.  If you don't you can make one really quick (just a blank .html file in that folder called 404.html).

Now we need to expose our s3 bucket to the outside world!  We will give it a policy to allow public access with the following command:
```bash
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$BUCKET_NAME/*\"}]}"
```

And that's it! If you set your s3 static site up in us-east-1 you should now be able to view it here:

 [http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com](http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com)

HINT: If you want to print out your s3 url in the terminal just run this:
```bash
echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

## Just Give Me The Script Please

If you were reading along but haven't run the commands yet, you can actually run them all together by running this script all at once as a bash file on your machine.  Don't forget to name your s3 bucket something relevant to you before running it! (If you didn't, you can always delete your buckets and start over too!)

```bash
# Name s3 bucket
BUCKET_NAME=mys3bucket

# Create s3 bucket
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1 --no-paginate

# Upload your static site
aws s3 sync ./_site s3://$BUCKET_NAME

# Set your entry and error pages + configure bucket permissions to be public
aws s3 website s3://$BUCKET_NAME  --index-document index.html --error-document 404.html

# Apply policy that is also required to make your s3 bucket accessible over the internet
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$BUCKET_NAME/*\"}]}"

# Print location of your s3 url (assuming you used us-east-1)
echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

If you made it this far thanks for sticking with it. I hope this helps someone else as consolidating this all together as a script has certainly improved my workflow.
