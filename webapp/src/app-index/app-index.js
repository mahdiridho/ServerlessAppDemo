import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import './app-credential.js';

/**
 * @customElement
 * @polymer
 */
class AppIndex extends PolymerElement {
  static get properties() {
    return {
      cogSync: Object
    }
  }

  static get template() {
    return html`
    <app-credential id="appCred"></app-credential>
    <input id="signin" type="button" value="Login" on-click="login" />
    <input class="signout" type="button" value="Logout" on-click="logout" style="display: none" />
    <input class="signout" type="button" value="test set item" on-click="setItems" style="display: none" />
    <input class="signout" type="button" value="test get data" on-click="getData" style="display: none" />
    <input class="signout" type="button" value="test delete data" on-click="deleteData" style="display: none" />
    <input class="signout" type="button" value="test sync data" on-click="syncData" style="display: none" />
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('authenticated', ()=>{
      alert('AWS Credential: \n'+AWS.config.credentials.identityId)

      this.$.signin.style.display = "none";
      var classSignout = this.shadowRoot.querySelectorAll(".signout");
      console.log(classSignout)
      for (let c=0; c<classSignout.length; c++)
        classSignout[c].style.display = "block";
      import('./app-sync-manager.js').then((elem)=>{
        console.info("Success");
        this.cogSync = new elem.AppSyncManager("userProfile", "dataPublic");
        console.log(this.cogSync)
      }).catch((e)=>{
        console.info("Fail ",e);
      })
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

  setItems(){
    let idToken = window.sessionStorage.getItem("token");
    var payload = idToken.split('.')[1];
    var tokenobj = JSON.parse(atob(payload));
    console.log(tokenobj)
    this.cogSync.create({
      userName:tokenobj['cognito:username'],
      userEmail:tokenobj.email,
      userCred:AWS.config.credentials.identityId
    }).then(()=>{
      console.log("done")
    }).catch((e)=>{
      console.log("cogSync error : ", e)
    })
  }

  getData(){
    this.cogSync.get();
  }

  deleteData(){
    this.cogSync.delete();
  }

  syncData(){
    this.cogSync.syncData();
  }
}

window.customElements.define('app-index', AppIndex);
