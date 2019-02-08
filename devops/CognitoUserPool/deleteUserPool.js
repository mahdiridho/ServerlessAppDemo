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
// If we want use other credential profile instead default
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: <credential_profile>});

let CommonModule = require("../modules/commonModule").commonModule;
let commonModule = new CommonModule();

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();

let poolParams = {};

// Check the user pool exists?
commonModule.poolExists(poolName).then((userPool)=>{
	if (userPool) {
    let domainParams = {
      Domain: poolName.toLowerCase(),
      UserPoolId: userPool
    }
  
    poolParams = { UserPoolId: userPool }

    // delete cognito user pool domain
    return CognitoUserPool.deleteUserPoolDomain(domainParams).promise();
	} else
    console.log(poolName+" Pool doesn't exist");
}).then((res)=>{
  if (res) {
  	console.log("Delete user pool domain success")

    // Do delete cognito user pool
    return CognitoUserPool.deleteUserPool(poolParams).promise();
  }
}).then((res)=>{
  if (res)
    console.log("Delete user pool success")
}).catch((e)=> {
  console.log(e.code+" : "+e.message)
});