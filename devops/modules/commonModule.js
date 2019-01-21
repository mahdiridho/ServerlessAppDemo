#! /usr/bin/env node
/*!
 * Author : Mahdi Ridho
 * You may retain, use or modify this file without written consent from
 */

"use strict";
let AWS=require("aws-sdk");

let CognitoUserPool = new AWS.CognitoIdentityServiceProvider();

class commonModule {
  /** Get the prefix from the command line argument list.
  \param argsIn The argument list composed of the following : ['nodejs', 'scriptName.js', 'arg1']; Where arg1 is your prefix.
  \return '' on error or the specified prefix.
  */
  getPrefix(argsIn){
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
  poolExists(poolName, next){
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
              return this.poolExists(poolName, list.NextToken);
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
  clientExists(userPoolId, clientName, next){
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
            return this.clientExists(userPoolId, clientName, list.NextToken);
          else // Not found the match ClientName on the finish page list
            return null;
      else // Empty list of clients
        return null;
    }).catch((e)=>{
      throw e;
    })
  }
}

module.exports = {
  commonModule
}