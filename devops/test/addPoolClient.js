#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";

/** Get the prefix from the command line argument list.
\param argsIn The argument list composed of the following : ['nodejs', 'scriptName.js', 'arg1']; Where arg1 is your prefix.
\return '' on error or the specified prefix.
*/
function getPrefix(argsIn){
  var args = argsIn.slice(2);
  if (args.length!=1) {
    console.log('wrong arg count');
    var scriptName=argsIn[1].match(/([^\/]*)\/*$/)[1];
    console.log('Usage: '+scriptName+' projectPrefix');
    console.log('For example :');
    var name = __dirname.match(/([^\/]*)\/*$/)[1];
    console.log('\t'+scriptName+' '+name.toLowerCase());
    return '';
  }
  return args[0];
}

/** Return whether the User Pool ID exists.
@param next pagination token
@return exist or null
*/
function exists(next){
    let params = {
      MaxResults: 1
    };
    if (next!=null)
      params.NextToken = next;
    return CognitoUserPool.listUserPools(params).promise().then((list)=>{
      if (list.UserPools && list.UserPools[0]) // If the list are available, check the match of PoolName
        if (list.UserPools[0].Name == poolName) // Found the match PoolName
        return list.UserPools[0].Id;
        else // Not found the match PoolName on the current page list
          if (list.NextToken) // If there is available next list, loop query list
            return exists(list.NextToken);
          else // Not found the match PoolName on the finish page list
            return null;
      else // Empty list of identities
        return null;
    }).catch((e)=>{
      throw e;
    })
}

/** Return whether the App Client ID exists.
@param next pagination token
@return exist or null
*/
function clientExists(userPoolId, next){
  let params = {
    UserPoolId: userPoolId,
    MaxResults: 1
  };
  if (next!=null)
    params.NextToken = next;
  return CognitoUserPool.listUserPoolClients(params).promise().then((list)=>{
    if (list.UserPoolClients && list.UserPoolClients[0]) // If the list are available, check the match of ClientName
      if (list.UserPoolClients[0].ClientName == clientName) // Found the match ClientName
        return list.UserPoolClients[0].ClientId;
      else // Not found the match ClientName on the current page list
        if (list.NextToken) // If there is available next list, loop query list
          return clientExists(userPoolId, list.NextToken);
        else // Not found the match ClientName on the finish page list
          return null;
    else // Empty list of clients
      return null;
  }).catch((e)=>{
    throw e;
  })
}

let args = getPrefix(process.argv);
let clientName = args;
if (!clientName)
  return

let poolName='UserPoolDemoSG';

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();
let userPoolId;

// Check the user pool exists?
exists().then((userPool)=>{
  if (userPool) {
    console.log("User pool id : "+userPool)
    userPoolId = userPool
    // Check the app client exists?
    return clientExists(userPoolId);
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