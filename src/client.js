import './../node_modules/custom-svg-iconset/src/custom-svg-iconset.js';
import './../node_modules/web-time-picker/dist/time-picker.js';

const date = new Date();

window.stateMachine = window.stateMachine || {
  days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  shortDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
};

class RRDAClient {
  constructor() {
    this.element = document.querySelector('rrda-client');
    this.element.innerHTML = `
    <style>
      rrda-client {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
      }

      header {
        width: 100%;
        height: 128px;
        display: flex;
        flex-direction: column;
        padding: 12px 24px;
        background: #1c313a;
        color: #eee;
        box-sizing: border-box;
      }

      .under-header, footer {
        width: 100%;
        height: 22px;
        display: block;
        background: #1c313a;
      }

      header section.toolbar {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        text-transform: uppercase;
      }

      header section.toolbar.bottom-bar {
        align-items: flex-end;
        text-transform: capitalize;
        height: 100%;
      }

      footer {
        bottom: 0;
        left: 0;
        right: 0;
        position: absolute;
      }

      a {
        color: #EEE;
        text-transform: uppercase;
        text-decoration: none;
      }

      .flex {
        flex: 1;
      }

      .flex2 {
        flex: 2;
      }

      .page:not(.selected) {
        opacity: 0;
      }

      custom-svg-icon {
        cursor: pointer;
      }

      [toggled] {
        fill: rgb(94, 146, 199)
      }

      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .title {
        font-size: 34px;
      }
      @media (min-width: 480px) {
        .title {
          font-size: 44px;
        }
      }

      .corners {
        display: block;
  	height: 100%;
        width: 100%;
        background: white;
      }

      .under-header .corners {
        border-top-right-radius: 45px;
        border-top-left-radius: 45px;
      }

      footer .corners {
        border-bottom-right-radius: 45px;
        border-bottom-left-radius: 45px;
      }
    </style>
    <custom-svg-iconset>
      <defs><svg>
        <g id="clock"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></g>
        <g id="lightbulb"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"></path></g>
      </svg></defs>
    </custom-svg-iconset>
    <header>
      <section class="toolbar">
        <span class="flex"></span>
        <h1 class="title">Home Control</h1>
        <span class="flex"></span>
      </section>
      <section class="toolbar bottom-bar">

        <span class="flex"></span>
        <custom-svg-icon icon="lightbulb" class="toggle-all"></custom-svg-icon>
      </section>
    </header>

    <span class="under-header">
      <span class="corners"></span>
    </span>

    <main>
      <span class="page devices selected">

      </span>
    </main>
    <footer>
      <span class="corners"></span>
    </footer>
    `;
    this.snapIt = this.snapIt.bind(this);
    this.toggleAll = this.toggleAll.bind(this);
    this.connectedCallback();
  }

  async connectedCallback() {
    await import('./../node_modules/custom-svg-icon/custom-svg-icon.js');
    await import('./rrda-device.js');
    firebase.auth().onAuthStateChanged(user => {
        if (!user) this.signinDialog();
        else {
          window.ref = firebase.database().ref(`${user.uid}`);
          this.user = user;
          // else localDevices = ['light'];
          ref.once('value').then(this.snapIt);
          ref.on('child_changed', this.snapIt);
        }
      });
    try {
      this.app = firebase.app();
      let features = ['auth', 'database'].filter(feature => typeof this.app[feature] === 'function');
    } catch (e) {
      console.error(e);
      document.innerHTML = 'Error loading the Firebase SDK, check the console.';
    }
    // TODO: online ....
    //window.navigator.onLine

    // (async() => {
      // window.client = await clientConnection({port: 6768, protocol: 'rrda-protocol', address: 'homecontrol.local.192.168.0.10.xip.io', wss: true});
      // const setup = await client.request('no-account');
      // if (!setup) this.showSetupDialog
      // TODO: setup device using users credentials or show dialog...
      // alert('device is not setup');
    // })();

    this.toggleAllElement = this.element.querySelector('.toggle-all');
    this.devicesPage = this.element.querySelector('.page.devices');

    this.element.querySelector('.toggle-all').addEventListener('click', this.toggleAll);

    // const devices = await window.client.request({url: 'devices'})
    // TODO: add available devices interface
  }

  snapIt(snap) {
    const key = snap.key;
    snap = snap.val();
    if (!snap) snap = [];
    let on = 0;
    if (key === this.user.uid) {
      let localDevices = localStorage.getItem('rrda-devices');
      if (localDevices) localDevices = JSON.parse(localDevices);

      for (let key of Object.keys(snap)) {
        const device = snap[key];
        const el = this.element.querySelector(`rrda-device[uid="${key}"]`) || document.createElement('rrda-device');
        if (!el.hasAttribute('index')) this.devicesPage.appendChild(el);
        el.setAttribute('name', localDevices ? localDevices[device.id] : Object.keys(snap).indexOf(device));
        el.setAttribute('value', device.dim);
        el.setAttribute('type', 'dimmable');
        el.setAttribute('index', device.id);
        el.setAttribute('clock', JSON.stringify(device.clock));
        el.setAttribute('uid', key);
        if (device.on) {
          el.setAttribute('toggled', '');
          on += 1;
        } else {
          el.removeAttribute('toggled');
        }
      }
    } else {
      const el = this.element.querySelector(`rrda-device[uid="${key}"]`);
      if (el) {
        el.setAttribute('value', snap.dim);
        el.setAttribute('clock', JSON.stringify(snap.clock));
        if (snap.on) {
          el.setAttribute('toggled', '');
          on += 1;
        } else {
          el.removeAttribute('toggled');
        }
      }

    }
    if (on > 0) this.toggleAllElement.setAttribute('toggled', '');
    else this.toggleAllElement.removeAttribute('toggled');
  }

  async toggleAll() {
    ref.once('value').then(snap => {
      snap = snap.val();
      if (!snap) snap = [];
      const toggled = this.toggleAllElement.hasAttribute('toggled');
      for (const uid of Object.keys(snap)) {
        const child = ref.child(`${uid}/on`);
        if (toggled) child.set(0);
        else child.set(1);
      }
      if (toggled) this.toggleAllElement.removeAttribute('toggled');
      else this.toggleAllElement.setAttribute('toggled', '');
    });
  }

  signinDialog() {
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    const uiconfig = {
      callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          document.querySelector('#firebaseui-auth-container').classList.add('hidden');
          return false;
        },
        uiShown: () => {
          document.querySelector('#firebaseui-auth-container').classList.remove('hidden');
        }
      },
      signInFlow: 'popup',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ]
    };
    ui.start('#firebaseui-auth-container', uiconfig);
  }
}

export default new RRDAClient();
