import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import './app-credential.js';

/**
 * @customElement
 * @polymer
 */
class AppIndex extends PolymerElement {
  static get template() {
    return html`
    <app-credential id="appCred"></app-credential>
    <input id="signin" type="button" value="Login" on-click="login" />
    <input id="signout" type="button" value="Logout" on-click="logout" style="display: none" />
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('authenticated', ()=>{
      alert('AWS Credential: \n'+AWS.config.credentials.identityId)
      this.$.signin.style.display = "none";
      this.$.signout.style.display = "block";
    })

    // Pull the global polymer vars
    if (window.XMLHttpRequest) var staticVar = new XMLHttpRequest();
    else var staticVar = new ActiveXObject('Microsoft.XMLHTTP');
    staticVar.onreadystatechange = (e)=>{
      if (staticVar.readyState === 4) {
        if(staticVar.status == 200) {
          window.Polymer = JSON.parse(staticVar.responseText);
          this.setVars()
        } else
          console.log("error")
      }
    }

    staticVar.open('get', "src/app-vars.json", true);
    staticVar.send(null);
  }

  setVars() {
    this.$.appCred.poolName = window.Polymer.poolName;
    this.$.appCred.poolId = window.Polymer.userPoolId;
    this.$.appCred.clientId = window.Polymer.clientId;
    this.$.appCred.identityId = window.Polymer.identityPoolId;
  }

  login(){
    this.$.appCred.login()
  }

  logout(){
    this.$.appCred.logout()
  }
}

window.customElements.define('app-index', AppIndex);
