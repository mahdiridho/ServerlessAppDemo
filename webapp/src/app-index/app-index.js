import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'aws-sdk/dist/aws-sdk.min';

/**
 * @customElement
 * @polymer
 */
class AppIndex extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'app-index'
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("AWS : ",AWS)
  }
}

window.customElements.define('app-index', AppIndex);
