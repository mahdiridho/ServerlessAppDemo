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

class DbWrite extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;

          padding: 10px;
        }
        .horizontal {
          @apply --layout-horizontal;
        }
        paper-button {
          min-height: 30px;
          height: 30px;
          background-color: var(--paper-light-blue-500);
          color: white;
        }
      </style>

      <div class="card">
        <h1>PUT</h2>
        <div class="horizontal">
          <paper-input id="putSecondary" placeholder="Secondary Key"></paper-input>
          <paper-input id="putName" placeholder="Full Name"></paper-input>
          <paper-input id="putAge" placeholder="Age"></paper-input>
        </div>
        <paper-button on-tap="saveData">Save</paper-button>
      </div>
      <div class="card">
        <h1>DELETE</h2>
        <div class="horizontal">
          <paper-input id="deleteSecondary" placeholder="Secondary Key"></paper-input>
        </div>
        <paper-button on-tap="deleteData">Delete</paper-button>
      </div>
      <div class="card">
        <h1>UPDATE</h2>
        <div class="horizontal">
          <paper-input id="updateSecondary" placeholder="Secondary Key"></paper-input>
          <paper-input id="updateName" placeholder="New Full Name"></paper-input>
          <paper-input id="updateAge" placeholder="New Age"></paper-input>
        </div>
        <paper-button on-tap="updateData">Update</paper-button>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.lambda = new AWS.Lambda();
  }

  reset() {
    this.$.putSecondary.value = "";
    this.$.putName.value = "";
    this.$.putAge.value = "";
    this.$.deleteSecondary.value = "";
    this.$.updateSecondary.value = "";
    this.$.updateName.value = "";
    this.$.updateAge.value = "";
  }

  saveData() {
    if (this.$.putSecondary.value != "" || this.$.putName.value != "" || this.$.putAge.value != "") {
      let payload = {
        method : "put",
        data : {
          prefix : AppVar.prefix,
          primaryKey : AWS.config.credentials.identityId,
          secondKey : this.$.putSecondary.value,
          name : this.$.putName.value,
          age : this.$.putAge.value
        }
      }
      let params = {
          FunctionName : AppVar.prefix+'_lambda',
          Payload: JSON.stringify(payload)
      }
      this.lambda.invoke(params).promise().then((data)=>{
        console.log(data);
        if (data.Payload)
          alert("Success")
        else
          alert("Fail")
        this.reset()
      }).catch((err)=>{
        alert(err.code)
        this.reset()
      })
    } else 
      alert("Input all items!")
  }

  deleteData() {
    if (this.$.deleteSecondary.value != "") {
      let payload = {
        method : "delete",
        data : {
          prefix : AppVar.prefix,
          primaryKey : AWS.config.credentials.identityId,
          secondKey : this.$.deleteSecondary.value
        }
      }
      let params = {
          FunctionName : AppVar.prefix+'_lambda',
          Payload: JSON.stringify(payload)
      }
      this.lambda.invoke(params).promise().then((data)=>{
        console.log(data);
        if (data.Payload)
          alert("Success")
        else
          alert("Fail")
        this.reset()
      }).catch((err)=>{
        alert(err.code)
        this.reset()
      })
    } else 
      alert("Input the secondary key!")
  }

  updateData() {
    if (this.$.updateSecondary.value != "" || this.$.updateName.value != "" || this.$.updateAge.value != "") {
      let payload = {
        method : "update",
        data : {
          prefix : AppVar.prefix,
          primaryKey : AWS.config.credentials.identityId,
          secondKey : this.$.updateSecondary.value,
          name : this.$.updateName.value,
          age : this.$.updateAge.value
        }
      }
      let params = {
          FunctionName : AppVar.prefix+'_lambda',
          Payload: JSON.stringify(payload)
      }
      this.lambda.invoke(params).promise().then((data)=>{
        console.log(data);
        if (data.Payload)
          alert("Success")
        else
          alert("Fail")
        this.reset()
      }).catch((err)=>{
        alert(err.code)
        this.reset()
      })
    } else 
      alert("Input all items!")
  }
}

window.customElements.define('db-write', DbWrite);