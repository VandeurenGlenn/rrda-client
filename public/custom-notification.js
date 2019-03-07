import { a as define, b as RenderMixin } from './chunk-157bcacb.js';

var customNotification = define(class CustomNotification extends RenderMixin(HTMLElement) {

  static get observedAttributes() {
    return ['text', 'action'];
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this._ok = this._ok.bind(this);
  }

  get button() {
    return this.shadowRoot.querySelector('button')
  }

  set text(value) {
    this._text = value;
    this.setAttribute('text', value);
    this.render({ text: value });
  }

  get text() {
    return this._text;
  }

  attributeChangedCallback(name, old, value) {
    if (this[name] !== value && value !== old) this[name] = value;
  }

  show() {
    this.button.addEventListener('click', this._ok);
    this.classList.add('shown');
    this.timeout = setTimeout(() => this.classList.remove('shown'), 10000);
  }

  _ok() {
    this.button.removeEventListener('click', this._ok);
    clearTimeout(this.timeout);
    this.classList.remove('shown');
    if (this.action) this.action();
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        position: absolute;
        left: 12px;
        bottom: 12px;
        transform: translate(-105%, -105%);
        height: 42px;
        width: 100%;
        padding: 12px;
        box-shadow: 3px 2px 4px 2px rgba(0,0,0, 0.15),
                    -2px 0px 4px 2px rgba(0,0,0, 0.15);
      }
      .flex {
        flex: 1;
      }
      button {
        border: none;
        background: transparent;
        color: orange;
        user-select: none;
        cursor: pointer;
      }
      :host(.shown) {
        transform: translate(0, 0);
        transition: transform;
      }
      @media (min-width: 321px) {
        :host {
          width: 320px;
        }
      }
    </style>
    <strong>${'text'}</strong>
    <span class="flex"></span>
    <button class="ok">ok</button>
    `;
  }
});

export default customNotification;
