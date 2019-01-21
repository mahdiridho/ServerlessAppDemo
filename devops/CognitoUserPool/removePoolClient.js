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
    userPoolId = userPool
    // Check the app client exists?
    return commonModule.clientExists(userPoolId, clientName);
  } else
    console.log(poolName+" Pool doesn't exist");
}).then((clientId)=>{
  if (clientId) {
    let clientParams = {
      ClientId: clientId,
      UserPoolId: userPoolId
    }
    // remove the app client from the user pool
    return CognitoUserPool.deleteUserPoolClient(clientParams).promise()
  } else
    console.log(clientName+" client doesn't exist");
}).then((client)=>{
  if (client)
  	console.log("Remove app client success")
}).catch((e)=> {
  console.log(e.code+" : "+e.message)
});