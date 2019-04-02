/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import './shared-styles.js';

class DbRead extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;

          padding: 10px;
        }
        .horizontal {
          @apply --layout-horizontal;
          @apply --layout-wrap;
        }
        paper-button {
          min-height: 30px;
          height: 30px;
          background-color: var(--paper-light-blue-500);
          color: white;
        }
      </style>

      <div class="card">
        <h1>GET</h2>
        <div class="horizontal">
          <paper-input id="getSecondary" placeholder="Secondary Key"></paper-input>
          <div>
            {{getItem}}
          </div>
        </div>
        <paper-button on-tap="getData">Get</paper-button>
      </div>
      <div class="card">
        <h1>QUERY</h2>
        <div class="horizontal">
          <paper-input id="querySecondary" placeholder="Secondary Key Begins String"></paper-input>
          <div>
            {{queryItem}}
          </div>
        </div>
        <paper-button on-tap="queryData">Query</paper-button>
      </div>
      <div class="card">
        <h1>SCAN</h2>
        <div class="horizontal">
          <paper-input id="scanSecondary" placeholder="Secondary Key Contains String"></paper-input>
          <div>
            {{scanItem}}
          </div>
        </div>
        <paper-button on-tap="scanData">Scan</paper-button>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.DynamoDB = new AWS.DynamoDB.DocumentClient();
  }

  reset() {
    this.$.getSecondary.value = "";
    this.$.querySecondary.value = "";
    this.$.scanSecondary.value = "";
  }

  getData() {
    this.getItem = null;
    if (this.$.getSecondary.value != "") {
      let params = {
          TableName: AppVar.prefix+'_dynamodb',
          Key:{
            "PrimaryKey": AWS.config.credentials.identityId,
            "SecondaryKey": this.$.getSecondary.value
          }
      }
      this.DynamoDB.get(params).promise().then((data)=>{
        console.log(data);
        if (data.Item)
          this.getItem = JSON.stringify(data.Item)
        this.reset()
      }).catch((err)=>{
        alert(err.message)
        this.reset()
      })
    } else 
      alert("Input the secondary key!")
  }

  queryData() {
    this.queryItem = null;
    if (this.$.querySecondary.value != "") {
      let params = {
          TableName: AppVar.prefix+'_dynamodb',
          KeyConditionExpression: "PrimaryKey = :p and begins_with(SecondaryKey, :s)",
          ExpressionAttributeValues : {
              ':p' : AWS.config.credentials.identityId,
              ':s' : this.$.querySecondary.value
          }
      }
      this.DynamoDB.query(params).promise().then((data)=>{
        console.log(data);
        if (data.Items.length>0)
          this.queryItem = JSON.stringify(data.Items)
        this.reset()
      }).catch((err)=>{
        alert(err.message)
        this.reset()
      })
    } else 
      alert("Input the secondary key contains!")
  }

  scanData() {
    this.scanItem = null;
    if (this.$.scanSecondary.value != "") {
      let params = {
          TableName: AppVar.prefix+'_dynamodb',
          FilterExpression: "PrimaryKey = :p and contains (SecondaryKey, :s)",
          ExpressionAttributeValues : {
              ':p' : AWS.config.credentials.identityId,
              ':s' : this.$.scanSecondary.value
          }
      }
      this.DynamoDB.scan(params).promise().then((data)=>{
        console.log(data);
        if (data.Items.length>0)
          this.scanItem = JSON.stringify(data.Items)
        this.reset()
      }).catch((err)=>{
        alert(err.message)
        this.reset()
      })
    } else 
      alert("Input the secondary key contains!")
  }
}

window.customElements.define('db-read', DbRead);
