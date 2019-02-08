# ServerlessAppDemo
Application Demo to learn Serverless practically. All devops stuff will work with AWS Class API from the link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html

# Requirements
1. Google Polymer
2. NodeJS
3. npm
4. polymer-cli

Follow this link https://blog.mahdiridho.xyz/instalasi-nodejs-npm-dan-polymer/ to prepare all required stuff above

# Quick Installation
Install the node packages

$ npm i

Create the AWS services

devops$ ./deploy.js

To delete the AWS services

devops$ ./destroy.js

# Run
Go to webapp folder and install the npm packages

webapp$ npm i

Before serve the webapp, fix the file node_modules/amazon-cognito-js/dist/amazon-cognito.min.js of line 13 :

	factory(root["AWS"]);

to be

	factory(AWS);

It will fix the issue of wrong AWS variable. Now, ready to serve:

webapp$ polymer serve

Open the url http://localhost:8081/ on the browser