# Name s3 bucket
BUCKET_NAME=jaywolfe.dev

# Create s3 bucket
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1

# Upload your static site
aws s3 sync ./_site s3://$BUCKET_NAME

# Set your entry and error pages + configure bucket permissions to be public
aws s3 website s3://$BUCKET_NAME  --index-document index.html --error-document 404.html

# Apply policy that is also required to make your s3 bucket accessible over the internet
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::$BUCKET_NAME/*\"}]}"

echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"

# Bonus - Create CloudFront for https + caching!
# makes an assumption for us-east-1 - just change the url how you need it
aws cloudfront create-distribution \
    --origin-domain-name "$BUCKET_NAME.s3-website-us-east-1.amazonaws.com" \
    --default-root-object index.html

# getting access denied errors on cloudfront url? check out https://aws.amazon.com/premiumsupport/knowledge-center/s3-website-cloudfront-error-403/
