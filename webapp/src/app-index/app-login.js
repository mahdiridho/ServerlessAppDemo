import { PolymerElement } from '@polymer/polymer/polymer-element.js';

/**
 * @customElement
 * @polymer
 */
export class AppLogin extends PolymerElement {
  static get properties() {
    return {
      poolName: { // User pool name
        type: String,
        observer: 'preparing'
      },
      poolId: { // User pool id
        type: String,
        observer: 'preparing'
      },
      clientId: { // User pool client id
        type: String,
        observer: 'preparing'
      },
      token : String // auth token
    }
  }

  /** Checking the properties ready
  */
  preparing() {
    if (this.poolName==null)
      return console.log('User pool name not present');
    if (this.poolId==null)
      return console.log('User pool ID not present');
    if (this.clientId==null)
      return console.log('User pool client ID not present');

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
    if (this.clientId && this.poolName && this.poolId) {
      console.log('login')
      let w = window.open('https://'+this.poolName+'.auth.'+this.poolId.split("_")[0]+'.amazoncognito.com/login?response_type=token&client_id='+this.clientId+'&redirect_uri='+this.re.exec(window.location.href)[0]+'&scope=email+profile+openid','popup','width=600,height=600');
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
  }
}

window.customElements.define('app-login', AppLogin);
