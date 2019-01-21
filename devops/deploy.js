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
let IAM = new AWS.IAM();

let cognitoParams = {
	"IdentityPoolName": prefix+"_pool",
	"AllowUnauthenticatedIdentities": true,
	"DeveloperProviderName": "Mahdi"
}

CognitoIdentity.createIdentityPool(cognitoParams).promise().then((cognitoIdentity)=>{
	console.log("Identity Pool just created : "+cognitoIdentity.IdentityPoolId)

	let roleDoc = {
		"Version": "2012-10-17",
		"Statement": [{
			Sid: 'Stmt'+new Date().getTime(),
			Effect: 'Allow',
			Principal: { "Federated":"cognito-identity.amazonaws.com" }, // The principal user is coming from cognito identity pool
			Action: "sts:AssumeRoleWithWebIdentity", // Allow get role from web identity
			Condition: {
				"StringEquals": {
				  "cognito-identity.amazonaws.com:aud" : cognitoIdentity.IdentityPoolId
				},
				"ForAnyValue:StringLike": {
				  "cognito-identity.amazonaws.com:amr" : "unauthenticated" // IAM Role for unauth credential
				}
			}
		}]
	}

	let roleParams = {
		RoleName : prefix+"_unauth",
		AssumeRolePolicyDocument : JSON.stringify(roleDoc)
	}

    return IAM.createRole(roleParams).promise();
}).then((iamRole)=>{
	console.log("Unauthenticated Role just created : ",iamRole.Role.Arn)
}).catch((e)=> {
	console.log(e.code)
	console.log(e.message)
})