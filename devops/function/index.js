"use strict";
let AWS = require('aws-sdk');
let DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	if (event.method == "put") {
	    let Item = {
	      PrimaryKey: event.data.primaryKey,
	      SecondaryKey: event.data.secondKey,
	      profile: {
	      	profileName: event.data.name,
	      	profileAge: event.data.age
	      }
	    }

	    return DynamoDB.put({
	      TableName: event.data.prefix+'_dynamodb',
	      Item:Item
	    }).promise().then(()=>{
	      console.log("PutItem succeeded");
	      return true;
	    }).catch((error)=>{
	      console.log("PutItem failed ",error);
	      return false;
	    })
	} else if (event.method == "delete"){
		let params = {
	      TableName: event.data.prefix+'_dynamodb',
	      Key:{
		      "PrimaryKey": event.data.primaryKey,
		      "SecondaryKey": event.data.secondKey,
  	      }
		}
		return DynamoDB.delete(params).promise().then((data)=>{
	      console.log("DeleteItem succeeded");
	      return true;
	    }).catch((error)=>{
	      console.log("DeleteItem failed ",error);
	      return false;
	    })
	} else if (event.method == "update"){
		let params = {
	      TableName: event.data.prefix+'_dynamodb',
	      Key:{
		      "PrimaryKey": event.data.primaryKey,
		      "SecondaryKey": event.data.secondKey,
  	      },
	      UpdateExpression: "set profile.profileName = :n, profile.profileAge=:a",
	      ExpressionAttributeValues:{
	          ":n":event.data.name,
	          ":a":""+event.data.age
	      },
	      ReturnValues:"UPDATED_NEW"
		}
		return DynamoDB.update(params).promise().then((data)=>{
	      console.log("UpdateItem succeeded");
	      return true;
	    }).catch((error)=>{
	      console.log("UpdateItem failed ",error);
	      return false;
	    })
	} else
		return event;
}
