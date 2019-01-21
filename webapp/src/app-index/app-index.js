import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'aws-sdk/dist/aws-sdk.min';

/**
 * @customElement
 * @polymer
 */
class AppIndex extends PolymerElement {
  static get template() {
    return html`
    <input id="getCred" type="button" on-click="getCredential" value="Get AWS Credential">
    <input id="clearCred" type="button" on-click="clearCredential" value="Clear AWS Credential" style="display: none">
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("AWS : ",AWS)
    AWS.config.update({
      region: "ap-southeast-1"
    })
  }

  getCredential() {
    if (typeof AWS == 'undefined')
      return console.log('the AWS object is not found');
    let cognitoParam = {
      'IdentityPoolId': <cognito_identity_pool_id>
    }

    AWS.config.credentials=new AWS.CognitoIdentityCredentials(cognitoParam);
    let gp=AWS.config.credentials.getPromise();
    gp.then(()=>{
      console.log('getCredentials done: ',AWS.config.credentials.identityId)
      alert('AWS Credential: \n'+AWS.config.credentials.identityId)
      this.$.getCred.style.display = "none";
      this.$.clearCred.style.display = "block";
    }).catch((err)=>{
      console.log('AWS.config.credentials.get')
      console.log("Error login : ", err);
      this.clearCredential();
    })
  }

  clearCredential() {
    if (AWS.config)
      AWS.config.credentials.clearCachedId();
    window.location.href = "/";
  }
}

window.customElements.define('app-index', AppIndex);
