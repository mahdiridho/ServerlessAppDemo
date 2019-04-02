import { AppLogin } from './app-login.js';
import 'aws-sdk/dist/aws-sdk.min';

/**
 * @customElement
 * @polymer
 */
class AppCredential extends AppLogin {
  static get properties() {
    return {
      identityId: { // Identity pool id
        type: String,
        observer: 'preparing'
      }
    }
  }

  /** Overload the preparing method tp check the properties ready
  */
  preparing() {
    if (typeof AWS == 'undefined')
      return console.log('the AWS object is not found');
    if (this.identityId==null)
      return console.log('Identity ID not present');
    super.preparing();
  }

  /** Once the login authenticated
  set the aws region, get it from the part of identityId string
  set the cognito user pool url domain
  get the aws credential
  */
  authenticated() {
    super.authenticated();

    AWS.config.update({
      region: this.identityId.split(":")[0]
    })
    this.url = 'cognito-idp.'+AWS.config.region+'.amazonaws.com/'+this.poolId;
    this.getCredential();
  }

  /** Exchange the login token to aws credential
  */
  getCredential() {
    if (this.token==null)
      return console.log('Auth token not present');
    let cognitoParam = {
      'IdentityPoolId': this.identityId
    }
    if (this.token != null) {
      cognitoParam.Logins = {};
      cognitoParam.Logins[this.url] = this.token;
    }

    AWS.config.credentials=new AWS.CognitoIdentityCredentials(cognitoParam);
    let gp=AWS.config.credentials.getPromise();
    gp.then(()=>{
      console.log('getCredentials done: ',AWS.config.credentials.identityId)
      window.dispatchEvent(new CustomEvent('authenticated'));
    }).catch((err)=>{
      console.log('AWS.config.credentials.get')
      console.log("Error login : ", err);
      this.logout();
    })
  }

  logout() {
    if (AWS.config) // Clear the credential cache
      AWS.config.credentials.clearCachedId();
    super.logout();
  }
}

window.customElements.define('app-credential', AppCredential);
