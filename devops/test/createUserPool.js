#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";

let poolName='UserPoolDemoSG';

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();

let poolParams = {
    "PoolName": poolName,
    "UsernameAttributes": ["email"], // Specifies whether email addresses or phone numbers can be specified as usernames when a user signs up.
    "AutoVerifiedAttributes": ['email'] // The attributes to be auto-verified. Possible values: email, phone_number.
}

// Create the new cognito user pool
CognitoUserPool.createUserPool(poolParams).promise().then((userPool)=>{
	console.log("User pool just created : "+userPool.UserPool.Id)

    let domainParams = {
      Domain: poolName.toLowerCase(), // Domain names can only contain lower-case letters, numbers, and hyphens
      UserPoolId: userPool.UserPool.Id
    }

    // Set the user pool domain name
    // The domain will be used for auth url link
    return CognitoUserPool.createUserPoolDomain(domainParams).promise();
}).then(()=>{
	console.log("Set user pool domain name success");
}).catch((e)=> {
	console.log(e.code)
	console.log(e.message)
})