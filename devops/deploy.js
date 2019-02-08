#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";

let prefix='AuthDemo';
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

let userPoolId, identityPoolId;

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
    let CallbackURLs = ["http://localhost:4200", "https://yourdomain.com"]
    // The list of allowed logout URLs for the identity providers.
    let LogoutURLs = ["http://localhost:4200", "https://yourdomain.com"]
    // The list of provider names for the identity providers that are supported on this client.
    let SupportedIdentityProviders = ['Google', 'COGNITO']
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
	// If user pool doesn't exist, create new one with new app client
    return CognitoUserPool.createUserPoolClient(clientParams).promise();
  }
}).then((client)=>{
	if (client) {
	  	console.log("App client id: "+client.UserPoolClient.ClientId);

		let cognitoParams = {
			"IdentityPoolName": prefix+"_pool",
			"AllowUnauthenticatedIdentities": false,
			"DeveloperProviderName": "Mahdi",
			"CognitoIdentityProviders": [{
				"ProviderName": "cognito-idp."+AWS.config.region+".amazonaws.com/"+userPoolId,
				"ClientId": client.UserPoolClient.ClientId,
				"ServerSideTokenCheck": true
			}]
		}

		// create new cognito identity pool
		return CognitoIdentity.createIdentityPool(cognitoParams).promise()
	}
}).then((cognitoIdentity)=>{
	console.log("Identity Pool just created : "+cognitoIdentity.IdentityPoolId)
	identityPoolId = cognitoIdentity.IdentityPoolId

	let createRoles = [];
	for (let r=0; r<2; r++) {
		let type = "authenticated", name = "auth";
		if (r==1) {
			type = "unauthenticated"
			name = "unauth"
		}
		let roleDoc = {
			"Version": "2012-10-17",
			"Statement": [{
				Sid: 'Stmt'+new Date().getTime(),
				Effect: 'Allow',
				Principal: { "Federated":"cognito-identity.amazonaws.com" }, // The principal user is coming from cognito identity pool
				Action: "sts:AssumeRoleWithWebIdentity", // Allow get role from web identity
				Condition: {
					"StringEquals": {
					  "cognito-identity.amazonaws.com:aud" : identityPoolId
					},
					"ForAnyValue:StringLike": {
					  "cognito-identity.amazonaws.com:amr" : type // IAM Role type
					}
				}
			}]
		}

		let roleParams = {
			RoleName : prefix+"_"+name,
			AssumeRolePolicyDocument : JSON.stringify(roleDoc)
		}
		createRoles.push(IAM.createRole(roleParams).promise())
	}

	// create new IAM Role authenticated and unauthenticated
    return Promise.all(createRoles)
}).then((iamRoles)=>{
	console.log("Authenticated Role just created : "+iamRoles[0].Role.Arn)
	console.log("Unauthenticated Role just created : "+iamRoles[1].Role.Arn)

    return CognitoIdentity.setIdentityPoolRoles({
      IdentityPoolId: identityPoolId,
      Roles: {unauthenticated: iamRoles[1].Role.Arn, authenticated: iamRoles[0].Role.Arn}
    }).promise();
}).then(()=>{
	console.log("Set identity pool roles success")

	// Found the aws account id
	return IAM.getUser().promise()
}).then((data)=>{
	// data.User.Arn -> arn:aws:iam::ACCOUNT_ID:user/UserName
	let accountId = data.User.Arn.split(":")[4];

	let putPolicies = [];

	// Policy statement for authenticated role
	let policyDoc = {
		"Version": "2012-10-17",
		"Statement": [
			{
				Sid: 'Stmt'+new Date().getTime(),
				Effect: 'Allow',
				Action: "cognito-sync:*", // give cognito data synchronize permission
				Resource: "arn:aws:cognito-sync:"+ AWS.config.region +":"+ accountId +":identitypool/"+ identityPoolId +"/*"
			}
		]
	}

	let policyParams = {
		RoleName : prefix+"_auth",
		PolicyName : prefix+"_auth",
	    PolicyDocument : JSON.stringify(policyDoc)
	}
	putPolicies.push(IAM.putRolePolicy(policyParams).promise())

	// Policy statement for unauthenticated role
	policyDoc = {
		"Version": "2012-10-17",
		"Statement": [
			{
				Sid: 'Stmt'+new Date().getTime(),
				Effect: 'Deny',
				Action: "*", // deny all permission for unauthenticated role
				Resource: "*"
			}
		]
	}

	policyParams = {
		RoleName : prefix+"_unauth",
		PolicyName : prefix+"_unauth",
	    PolicyDocument : JSON.stringify(policyDoc)
	}
	putPolicies.push(IAM.putRolePolicy(policyParams).promise())

	// put IAM Policies authenticated and unauthenticated
    return Promise.all(putPolicies);
}).then(()=>{
	console.log("Authenticated permission just set")
	console.log("Unauthenticated permission just set")
}).catch((e)=> {
	console.log(e.code)
	console.log(e.message)
})