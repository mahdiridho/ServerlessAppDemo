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

// Import the service class
let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();

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

let poolParams = {};

// Check the user pool exists?
exists().then((userPool)=>{
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