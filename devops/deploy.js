#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";

let poolName='UserPoolDemoSG';

let archiver = require('archiver');
let fs = require("fs");

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
let dynamodbParams = require('./json/dynamoDB.json');
// set dynamodb table name
dynamodbParams.TableName = prefix+"_dynamodb";
let lambdaParams = require('./json/lambda.json');
// set lambda function name
lambdaParams.FunctionName = prefix+"_lambda";
let functionDir = "./function";

// Import all service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();
let CognitoIdentity = new AWS.CognitoIdentity();
let IAM = new AWS.IAM();
let DynamoDB = new AWS.DynamoDB();
let Lambda = new AWS.Lambda();

let userPoolId, identityPoolId, ARNs = {};

// Check the user pool exists?
commonModule.poolExists(poolName).then((userPool)=>{
  if (userPool) {
    console.log("User pool id : "+userPool)
    userPoolId = userPool
    // Check the app client exists?
    return commonModule.clientExists(userPoolId, prefix);
  } else
    throw {code:'UserPoolNotExist', message:poolName+" Pool doesn't exist"};
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
      ClientName: prefix,
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

		console.log("Creating cognito federated identity pool")
		// create new cognito identity pool
		return CognitoIdentity.createIdentityPool(cognitoParams).promise()
	}
}).then((cognitoIdentity)=>{
	console.log("Identity Pool just created : "+cognitoIdentity.IdentityPoolId)
	identityPoolId = cognitoIdentity.IdentityPoolId

	console.log("\nCreating dynamodb table")
	return DynamoDB.createTable(dynamodbParams).promise();
}).then((tableResult)=>{
	console.log("Waiting for the table activation")
	ARNs.dynamodbARN = tableResult.TableDescription.TableArn;

	return DynamoDB.describeTable({'TableName' : dynamodbParams.TableName}).promise();
}).then((tableState)=>{
	if (tableState.Table.TableStatus != 'DELETING' || tableState.Table.TableStatus == 'CREATING')
		return DynamoDB.waitFor('tableExists',{TableName: dynamodbParams.TableName}).promise();
	else
		throw {code:'ResourceInUseException', message:dynamodbParams.TableName+" table is "+tableState.Table.TableStatus};
}).then((table)=>{
	console.log("tableExists status: ",table.Table.TableStatus);
	if (table.Table.TableStatus == "ACTIVE") {
		console.log("\nCreating lambda function")
		console.log("Compressing the function folder")
	    return new Promise((resolve, reject)=>{
	      var output = fs.createWriteStream("/tmp/"+lambdaParams.FunctionName+".zip");
	      var archive = archiver('zip', {
	        zlib: { level: 9 } // Highest compression level.
	      });
	      archive.on('error', (err)=>{
	        return reject({message:'Couldn\'t zip the dir '+lambdaParams.FunctionName});
	      });
	      archive.on('finish', ()=>{
	        return resolve();
	      });
	      archive.pipe(output);
	      archive.directory(functionDir, ''); // This puts the contents of dirName to the root of the archive
	      archive.finalize();
	    })
	}
	else
		throw {code:'tableState', message:dynamodbParams.TableName+' status: '+table.Table.TableStatus};
}).then(()=>{
	console.log("Checking the file compression")
    return new Promise((resolve, reject)=>{
      fs.open("/tmp/"+lambdaParams.FunctionName+".zip", 'r', (err, fd)=>{
        if (err)
          return reject({message:"couldn't open the file /tmp/"+lambdaParams.FunctionName+".zip"})
        else{
          fs.closeSync(fd);
          return resolve();
        }
      })
    })
}).then(()=>{
	// Set the lambda code
	lambdaParams.Code = {ZipFile: fs.readFileSync("/tmp/"+lambdaParams.FunctionName+".zip")};
	console.log("Setting up IAM lambda Role")
	let roleDoc = {
		"Version": "2012-10-17",
		"Statement": [{
			Sid: 'Stmt'+new Date().getTime(),
			Effect: 'Allow',
			Principal: {"Service": "lambda.amazonaws.com"},
			Action: "sts:AssumeRole"
		}]
	}

	let roleParams = {
		RoleName : prefix+"_lambda",
		AssumeRolePolicyDocument : JSON.stringify(roleDoc)
	}
	return IAM.createRole(roleParams).promise();
}).then((lambdaRole)=>{
	// set the lambda role source
	lambdaParams.Role = lambdaRole.Role.Arn;
	console.log("Uploading the function ",lambdaParams)
    let request = Lambda.createFunction(lambdaParams);
    return request.on('retry', (response)=>{
      console.log(response.error.code)
      if(response.error.message == "The role defined for the function cannot be assumed by Lambda.") {
        console.log("Retrying createFunction : createRole successfully completed!")
        response.error.retryable = true;
        response.error.retryDelay = 10000;
      }else if(response.error.code == "UnknownEndpoint") {
        console.log("Retrying createFunction : UnknownEndpoint!")
        response.error.retryable = true;
        response.error.retryDelay = 2000;
      } else
        throw response.error;
    }).promise();
}).then((lambdaFunc)=>{
	ARNs.lambdaARN = lambdaFunc.FunctionArn;
	// Set the cloudwatch resource
	// It will add to lambda policy for log and debugging
	let accountId = lambdaFunc.FunctionArn.split(":")[4];
	ARNs.cloudwatchARN = "arn:aws:logs:*:"+ accountId +":*"

	console.log("Setting up IAM policy for lambda role")
	console.log("Give access to dynamodb put, delete, and update");

	// Policy statement for lambda role
	let policyDoc = {
		"Version": "2012-10-17",
		"Statement": [
			{
				Sid: 'Stmt'+new Date().getTime(),
				Effect: 'Allow',
				Action: ["dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:UpdateItem"],
				Resource: ARNs.dynamodbARN
			},
			{
				Sid: 'Stmt'+new Date().getTime()+1,
				Effect: 'Allow',
				Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
				Resource: ARNs.cloudwatchARN
			}
		]
	}

	let policyParams = {
		RoleName : prefix+"_lambda",
		PolicyName : prefix+"_lambda",
	    PolicyDocument : JSON.stringify(policyDoc)
	}
	return IAM.putRolePolicy(policyParams).promise();
}).then(()=>{
	console.log("\nSetting up IAM auth & unauth Role")
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

	console.log("\nSetting up IAM policy for auth & unauth role")
	console.log("Give access to dynamodb get, query, scan, and lambda invoke function for auth role");
	console.log("Deny all accesses for unauth role");

	let putPolicies = [];

	// Policy statement for authenticated role
	let policyDoc = {
		"Version": "2012-10-17",
		"Statement": [
			{
				Sid: 'Stmt'+new Date().getTime(),
				Effect: 'Allow',
				Action: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
				Resource: ARNs.dynamodbARN
			},
			{
				Sid: 'Stmt'+new Date().getTime()+1,
				Effect: 'Allow',
				Action: "lambda:InvokeFunction",
				Resource: ARNs.lambdaARN
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
	console.log(e.code+" : "+e.message)
})