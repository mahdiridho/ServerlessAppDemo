#! /usr/bin/env node

"use strict";

let prefix='AuthDemo';
let identityPoolName = prefix+"_pool";
let poolName='UserPoolDemoSG';

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});
// If we want use other credential profile instead default
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: <credential_profile>});

let CommonModule = require("./modules/commonModule").commonModule;
let commonModule = new CommonModule();
let args = commonModule.getPrefix(process.argv);
let clientName = args;
if (!clientName)
  return

// Import all service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();
let CognitoIdentity = new AWS.CognitoIdentity();
let IAM = new AWS.IAM();

let userPoolId

// Remove role permissions
Promise.all([
	IAM.deleteRolePolicy({PolicyName: prefix+"_auth", RoleName: prefix+"_auth"}).promise(),
	IAM.deleteRolePolicy({PolicyName: prefix+"_unauth", RoleName: prefix+"_unauth"}).promise()
]).then(()=>{
	console.log("Remove role permissions success")

	return Promise.all([
		IAM.deleteRole({RoleName: prefix+"_auth"}).promise(),
		IAM.deleteRole({RoleName: prefix+"_unauth"}).promise()
	])
}).then(()=>{
	console.log("Delete IAM Roles success")

	// first check if the service exists
	return commonModule.identityExists(identityPoolName);
}).then((poolId)=>{
	if (poolId) {
		let cognitoParams = { IdentityPoolId: poolId }
	    // Do delete cognito identity
	    return CognitoIdentity.deleteIdentityPool(cognitoParams).promise();
	} else {
	    console.log(identityPoolName+" Cognito Pool doesn't exist");
	    return
	}
}).then((identityPool)=>{
	if (identityPool) {
		console.log("Delete Cognito Identity Pool success")

		// Check the user pool exists?
		return commonModule.poolExists(poolName);
	}
}).then((userPool)=>{
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