import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * @customElement
 * @polymer
 */
class AppIndex extends PolymerElement {
  static get template() {
    return html`
    <input id="signin" type="button" value="Login" on-click="login" />
    <input id="signout" type="button" value="Logout" on-click="logout" style="display: none" />
    `;
  }

  static get properties() {
    return {
      token : String // auth token
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (window.XMLHttpRequest) var staticVar = new XMLHttpRequest();
    else var staticVar = new ActiveXObject('Microsoft.XMLHTTP');
    staticVar.onreadystatechange = (e)=>{
      if (staticVar.readyState === 4) {
        if(staticVar.status == 200) {
          window.Polymer = JSON.parse(staticVar.responseText);
          window.dispatchEvent(new CustomEvent('polymerVars'));
        } else
          console.log("error")
      }
    }

    staticVar.open('get', "src/app-vars.json", true);
    staticVar.send(null);

    this.re = new RegExp(/^.*\//);
    if (window.sessionStorage.getItem("token")) {
      this.token = window.sessionStorage.getItem("token");
      this.authenticated();
      return;
    }
    let urlRefer = window.location.href.replace("#","?");
    let url = new URL(urlRefer);

    if((url.searchParams.get("id_token") || url.searchParams.get("access_token")) && url.searchParams.get("expires_in") && url.searchParams.get("token_type")) {
      window.opener.postMessage((url.searchParams.get("id_token"))?url.searchParams.get("id_token"):url.searchParams.get("access_token"), this.re.exec(window.location.href)[0]);
      window.close();
    }
  }

  /** Once click login event, Open popup login redirect to User Pool Domain Name
  Initialize a cognito auth object.
  */
  login(){
    if (window.Polymer.clientId && window.Polymer.poolName && window.Polymer.userPoolId) {
      console.log('login')
      let w = window.open('https://'+window.Polymer.poolName+'.auth.'+window.Polymer.userPoolId.split("_")[0]+'.amazoncognito.com/login?response_type=token&client_id='+window.Polymer.clientId+'&redirect_uri='+this.re.exec(window.location.href)[0]+'&scope=email+profile+openid','popup','width=600,height=600');
      w.document.title = "User Authentication";
      window.addEventListener("message", (e)=>{
        this.token = e.data;
        window.sessionStorage.setItem("token",e.data);
        if (e.origin == window.location.origin) {
          this.authenticated();
        }
      }, false);
      window.addEventListener("error", (e)=>{
        console.log(e)
      }, false);
    } else
      alert("Missing properties!")
  }

  /** Logout of app. Clear any session storage
  */
  logout(){
    console.log('logout')
    window.sessionStorage.removeItem("token");
    window.location.href = "/";
  }

  /** Overload this to handle higher level setup in your class.
  On successful authentication call this method
  */
  authenticated(){
    console.log(this.token)
    console.log('authenticated');
    this.$.signin.style.display = "none";
    this.$.signout.style.display = "block";
  }
}

window.customElements.define('app-index', AppIndex);
