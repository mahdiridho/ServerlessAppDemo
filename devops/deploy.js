#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";

let prefix='UnauthDemo';

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});

// Import all service class
let CognitoIdentity = new AWS.CognitoIdentity();

let cognitoParams = {
	"IdentityPoolName": prefix+"_pool",
	"AllowUnauthenticatedIdentities": true,
	"DeveloperProviderName": "Mahdi"
}

CognitoIdentity.createIdentityPool(cognitoParams).promise().then((cognitoIdentity)=>{
	console.log("Identity Pool just created : "+cognitoIdentity.IdentityPoolId)
})