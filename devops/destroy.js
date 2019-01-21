#! /usr/bin/env node

"use strict";

let prefix='UnauthDemo';
let identityPoolName = prefix+"_pool";

let AWS=require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-1"
});

// Import all service class
let CognitoIdentity = new AWS.CognitoIdentity();

/** Return whether the Identity Pool ID exists.
@param next pagination token
@return exist or null
*/
function exists(next){
	let params = {
	  MaxResults: 1
	};
	if (next!=null)
	  params.NextToken = next;
	return CognitoIdentity.listIdentityPools(params).promise().then((list)=> {
	  if (list.IdentityPools && list.IdentityPools[0]) // If the list are available, check the match of IdentityPoolName
	    if (list.IdentityPools[0].IdentityPoolName == identityPoolName) // Found the match IdentityPoolName
	      return list.IdentityPools[0].IdentityPoolId;
	    else // Not found the match IdentityPoolName on the current page list
	      if (list.NextToken) // If there is available next list, loop query list
	        return exists(list.NextToken);
	      else // Not found the match IdentityPoolName on the finish page list
	        return null;
	  else // Empty list of identities
	    return null;
	}).catch((e)=>{
	  throw e;
	})
}

// first check if the service exists
exists().then((exist)=>{
  if (exist) {
	let cognitoParams = { IdentityPoolId: exist }
	console.log(cognitoParams)
    // Do delete cognito identity
    return CognitoIdentity.deleteIdentityPool(cognitoParams).promise().then(()=>{
      console.log("Delete identity pool success");
    })
  } else
    console.log(identityPoolName+" Cognito Pool doesn't exist");
}).catch((e)=> {
  console.log(e.code+" : "+e.message)
});