---
title: How I Make an AWS S3 Bucket Into a Static Site With an SSL Certificate
description: When I launch a static site I want it to be as fast as possible. One easy way to do that is with AWS CloudFront - AWS's CDN Network.  It uses edge locations to load content up for your users as fast as possible and leverages heavy caching to do so in a performant manner.  Keep reading to learn how to integrate CloudFront with your static site hosted in an AWS Simple Storage Service (S3) Bucket
date: "2021-02-23"
tags: [AWS, Node.js, EleventyJS]
published: true
---

## {{ title }}

When I launch a static site I want it to be as fast as possible with as little effort as possible. One easy way to do that is with AWS CloudFront - AWS's CDN Network. It uses edge locations to load content up for your users as fast as possible and leverages heavy caching to do so in a performant manner. Keep reading to learn how to integrate CloudFront with your static site hosted in an AWS Simple Storage Service (S3) Bucket.

## Make Sure You Have a Static Site Deployed in S3 Already

Do you already have a static site deployed into an s3 bucket? Is it set to a public website? If you answered no to either of these questions then check out my previous post here: [How I Quickly Create Static Website Hosting Using Only an AWS S3 Bucket](/blog/how-i-quickly-create-static-website-hosting-using-only-an-aws-s3-bucket/).

## Get An SSL Certificate for your S3 Static Site Automatically By Using AWS CloudFront

Let's assume your s3 bucket name is `mys3bucket123`. You can run this cli command to quickly create a CloudFront distribution. You will need to edit it a bit after this in the console unless you want to manage a pretty big JSON configuration file (not worth it in my opinion unless you're setting up for a CI process that will be used by many).

```bash
aws cloudfront create-distribution \
    --origin-domain-name "mys3bucket123.s3-website-us-east-1.amazonaws.com" \
    --default-root-object index.html
```

## Finish Getting Your SSL Certificate in the AWS Console

1. Go to the CloudFront distributions service in the AWS Console
2. Click the distribution you just created in the CLI (it will probably say Status: In Progress..)
3. Go to the tab named "Behaviors":
   ![Behavior Tab](/assets/images/cloudfront-behaviors.png)

4. Click the checkbox next to it in the table and click the "Edit" button
5. Change the "Viewer Protocol Policy" to "Redirect HTTP to HTTPS":
   ![Behavior Policy](/assets/images/cloudfront-behavior-policy.png)
6. Click Save
7. Your CloudFront Distribution will redploy and voila! Check the "Domain Name" field for your distribution you just created to see where your site is hosted at.
   ![CloudFront Origin](/assets/images/cloudfront-origin.png)

Go ahead and visit that URL (after CloudFront is done deploying your changes) and see your SSL in action!
