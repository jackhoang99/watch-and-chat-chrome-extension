#!/bin/bash

# Deploy script for Watch & Chat backend

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found. Please create one with your MongoDB and AWS credentials."
    exit 1
fi

# Build the extension
echo "Building the extension..."
npm run build

# Create a deployment package
echo "Creating deployment package..."
mkdir -p deploy
cp -r server node_modules package.json package-lock.json .env deploy/

# Deploy to AWS Elastic Beanstalk (if configured)
if [ -f .elasticbeanstalk/config.yml ]; then
    echo "Deploying to AWS Elastic Beanstalk..."
    cd deploy
    eb deploy
    cd ..
else
    echo "AWS Elastic Beanstalk configuration not found."
    echo "Please set up your AWS Elastic Beanstalk environment first."
    echo "You can do this by running: eb init"
fi

# Clean up
echo "Cleaning up..."
rm -rf deploy

echo "Deployment complete!"
echo "Remember to update the SOCKET_URL in content.js and popup.js to point to your production server." 