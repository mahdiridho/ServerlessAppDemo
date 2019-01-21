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

let CommonModule = require("../modules/commonModule").commonModule;
let commonModule = new CommonModule();

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();

let poolParams = {
    "PoolName": poolName,
    "UsernameAttributes": ["email"], // Specifies whether email addresses or phone numbers can be specified as usernames when a user signs up.
    "AutoVerifiedAttributes": ['email'] // The attributes to be auto-verified. Possible values: email, phone_number.
}
let poolId;

// Check the user pool exists?
commonModule.poolExists(poolName).then((exist)=>{
  if (exist)
    console.log("User pool already exists : "+exist)
  else
  // Create the new cognito user pool
  return CognitoUserPool.createUserPool(poolParams).promise();
}).then((userPool)=>{
  if (userPool) {
  	console.log("User pool just created : "+userPool.UserPool.Id)
    poolId = userPool.UserPool.Id

    let domainParams = {
      Domain: poolName.toLowerCase(), // Domain names can only contain lower-case letters, numbers, and hyphens
      UserPoolId: poolId
    }

    // Set the user pool domain name
    // The domain will be used for auth url link
    return CognitoUserPool.createUserPoolDomain(domainParams).promise();
  }
}).then((domain)=>{
  if (domain) {
  	console.log("Set user pool domain name success");

    let providerParams = [
      {
        ProviderName: "LoginWithAmazon",
        ProviderType: "LoginWithAmazon",
        ProviderDetails: {
          client_id: <amazon_client_id>,
          client_secret: <amazon_client_secret>,
          authorize_scopes:"profile postal_code"
        }
      },
      {
        ProviderName: "Google",
        ProviderType: "Google",
        ProviderDetails: {
          client_id: <google_client_id>,
          client_secret: <google_client_secret>,
          authorize_scopes:"profile email openid"
        }
      }
    ]

    let providers = [];
    for (let p=0; p<providerParams.length; p++) {
      providerParams[p].UserPoolId = poolId;
      providerParams[p].AttributeMapping = {'email':'email'};
      providers[p] = CognitoUserPool.createIdentityProvider(providerParams[p]).promise();
    }

    return Promise.all(providers);
  }
}).then((social)=>{
  if (social)
    console.log("Enable social login providers success");
}).catch((e)=> {
	console.log(e.code)
	console.log(e.message)
})