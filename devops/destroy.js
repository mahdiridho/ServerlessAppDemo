#! /usr/bin/env node

"use strict";

let poolName='UserPoolDemoSG';

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});
// If we want use other credential profile instead default
//AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: <credential_profile>});

let CommonModule = require("./modules/commonModule").commonModule;
let commonModule = new CommonModule();
let prefix = commonModule.getPrefix(process.argv);
if (!prefix)
  return
let identityPoolName = prefix+"_pool";

// Import all service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();
let CognitoIdentity = new AWS.CognitoIdentity();
let IAM = new AWS.IAM();
let Lambda = new AWS.Lambda();
let DynamoDB = new AWS.DynamoDB();

let userPoolId

console.log("Deleting lambda function")
new Promise((resolve, reject)=>{
	return Lambda.deleteFunction({FunctionName: prefix+"_lambda"}).promise().then(()=>{
		return resolve();
	}).catch((e)=>{
		// Do next step whatever get step error to make sure all resources removed
		return resolve();
	})
}).then(()=>{
	console.log("\nDeleting dynamodb table")
    return DynamoDB.deleteTable({'TableName' : prefix+"_dynamodb"}).promise().then(()=>{
		return;
	}).catch((e)=>{
		// Do next step whatever get step error to make sure all resources removed
		return;
	})
}).then(()=>{
	console.log("\nDeleting IAM Policies")
	// Remove role permissions
	return Promise.all([
		IAM.deleteRolePolicy({PolicyName: prefix+"_auth", RoleName: prefix+"_auth"}).promise(),
		IAM.deleteRolePolicy({PolicyName: prefix+"_unauth", RoleName: prefix+"_unauth"}).promise(),
		IAM.deleteRolePolicy({PolicyName: prefix+"_lambda", RoleName: prefix+"_lambda"}).promise()
	]).catch((e)=>{
		// Do next step whatever get step error to make sure all resources removed
		return;
	})
}).then(()=>{
	console.log("\nDeleting IAM Roles")
	return Promise.all([
		IAM.deleteRole({RoleName: prefix+"_auth"}).promise(),
		IAM.deleteRole({RoleName: prefix+"_unauth"}).promise(),
		IAM.deleteRole({RoleName: prefix+"_lambda"}).promise()
	]).catch((e)=>{
		// Do next step whatever get step error to make sure all resources removed
		return;
	})
}).then(()=>{
	console.log("\nDeleting cognito federated identity pool")
	// first check if the service exists
	return commonModule.identityExists(identityPoolName);
}).then((poolId)=>{
	if (poolId) {
		let cognitoParams = { IdentityPoolId: poolId }
	    // Do delete cognito identity
	    return CognitoIdentity.deleteIdentityPool(cognitoParams).promise()
	} else {
	    console.log(identityPoolName+" Cognito Pool doesn't exist");
	    return
	}
}).then((identityPool)=>{
	if (identityPool) {
		console.log("\nDeleting cognito user pool client")

		// Check the user pool exists?
		return commonModule.poolExists(poolName);
	}
}).then((userPool)=>{
	if (userPool) {
		userPoolId = userPool
		// Check the app client exists?
		return commonModule.clientExists(userPoolId, prefix);
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
		console.log(prefix+" client doesn't exist");
}).then((client)=>{
	if (client)
		console.log("Remove app client success")
}).catch((e)=> {
  console.log(e.code+" : "+e.message)
});