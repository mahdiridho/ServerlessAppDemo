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
let args = commonModule.getPrefix(process.argv);
let clientName = args;
if (!clientName)
  return

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();
let userPoolId;

// Check the user pool exists?
commonModule.poolExists(poolName).then((userPool)=>{
  if (userPool) {
    console.log("User pool id : "+userPool)
    userPoolId = userPool
    // Check the app client exists?
    return commonModule.clientExists(userPoolId, clientName);
  } else
    console.log(poolName+" Pool doesn't exist");
}).then((clientId)=>{
  if (clientId)
    console.log("App Client already exists, you must delete first or use a different name")
  else {
    // The list of allowed redirect (callback) URLs for the identity providers.
    let CallbackURLs = ["http://localhost:8081", "https://yourdomain.com"]
    // The list of allowed logout URLs for the identity providers.
    let LogoutURLs = ["http://localhost:8081", "https://yourdomain.com"]
    // The list of provider names for the identity providers that are supported on this client.
    let SupportedIdentityProviders = ['Google', 'LoginWithAmazon', 'COGNITO']
    let clientParams = {
      ClientName: clientName,
      UserPoolId: userPoolId,
      AllowedOAuthFlows: ['code', 'implicit'],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: ['email', 'openid', 'profile'],
      CallbackURLs: CallbackURLs,
      LogoutURLs: LogoutURLs,
      GenerateSecret: true,
      RefreshTokenValidity: 30,
      SupportedIdentityProviders: SupportedIdentityProviders
    }
    return CognitoUserPool.createUserPoolClient(clientParams).promise();
  }
}).then((client)=>{
  if (client)
  	console.log("App client id: "+client.UserPoolClient.ClientId);
}).catch((e)=> {
	console.log(e.code)
	console.log(e.message)
})