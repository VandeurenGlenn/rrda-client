import define from './../node_modules/backed/src/utils/define.js';
import RenderMixin from './../node_modules/custom-renderer-mixin/src/render-mixin.js';
import './clock/day-selector.js';
import './../node_modules/custom-pages/src/custom-pages.js'

export default define(class RrdaDevice extends RenderMixin(HTMLElement) {
  static get observedAttributes() {
    return ['value', 'type', 'name', 'index', 'clock', 'uid']
  }

  get properties() {
    return {
      value: 0,
      name: 'lightbulb',
      type: 'light'
    }
  }

  set uid(value) {
    this._uid = value;
    this.setAttribute('uid', value)
  }

  get uid() {
    return this._uid || this.getAttribute('uid');
  }

  set name(value) {
    this.properties.name = value;
  }

  set type(value) {
    if (value === 'dimmable' && !this.input) {
      const input = document.createElement('input');
      input.type = 'range';
      input.value = this.value || 0;
      input.step = 5;
      input.min = 0;
      input.max = 100;
      this.shadowRoot.appendChild(input)
      input.addEventListener('change', this._onChange);
    } else {
      this.input.removeEventListener('change', this._onChange);
    }
    this.properties.type = value;
  }

  set value(value) {
    if (this.input && this.input.value !== value) this.input.value = value;
    this.properties.value = value;
  }

  get name() {
    return this.properties.name;
  }

  get value() {
    return this.properties.value;
  }

  get type() {
    return this.properties.type;
  }

  get input() {
    return this.shadowRoot.querySelector('input');
  }

  get button() {
    return this.shadowRoot.querySelector('custom-svg-icon[icon="lightbulb"]');
  }

  get timePickerButton() {
    return this.shadowRoot.querySelector('custom-svg-icon[icon="clock"]');
  }

  get startTimePicker() {
    return this.shadowRoot.querySelector('time-picker.start');
  }

  get endTimePicker() {
    return this.shadowRoot.querySelector('time-picker.end');
  }

  set clock(value) {
    this._clock = value;
    this.startTimePicker.time = value[stateMachine.shortDays.indexOf(this.selected)].start
    this.endTimePicker.time = value[stateMachine.shortDays.indexOf(this.selected)].stop
  }

  get clock() {
    return this._clock;
  }

  get daySelector() {
    return this.shadowRoot.querySelector('day-selector');
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this._onChange = this._onChange.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onStartTimePicker = this._onStartTimePicker.bind(this);
    this._onEndTimePicker = this._onEndTimePicker.bind(this);
    this._onDaySelected = this._onDaySelected.bind(this);
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    const today = stateMachine.shortDays[new Date().getDay()]
    this.button.addEventListener('click', this._onClick);
    this.startTimePicker.addEventListener('time-picker-action', this._onStartTimePicker);
    this.endTimePicker.addEventListener('time-picker-action', this._onEndTimePicker);
    this.daySelector.addEventListener('selected', this._onDaySelected)

    this.selected = today
    // this.clock = JSON.parse(this.getAttribute('clock'));
    if (this.daySelector.rendered) this.daySelector.selected = today
    else this.timeoutDaySelector()
  }

  timeoutDaySelector() {
    setTimeout(() => {
      if (this.daySelector.rendered) this.daySelector.selected = this.selected
      else this.timeoutDaySelector()
    }, 100);
  }

  attributeChangedCallback(name, oldValue, value) {
    if (oldValue !== value)  {
      this[name] = name === 'clock' ? JSON.parse(value) : value;

      this.render();
    }
  }

  _onDaySelected({detail}) {
    this.selected = detail;
    stateMachine.shortDays.indexOf(detail)
    const time = this.clock[stateMachine.shortDays.indexOf(detail)];
    this.startTimePicker.time = time.start;
    this.endTimePicker.time = time.stop;
  }

  _onStartTimePicker({detail}) {
    const day = stateMachine.shortDays.indexOf(this.selected)
    if (detail.action !== 'ok') return;
    this.clock[day].start = detail.time;
    ref.child(`${this.uid}/clock`).set(this.clock);
  }

  _onEndTimePicker({detail}) {
    const day = stateMachine.shortDays.indexOf(this.selected)
    if (detail.action !== 'ok') return;
    this.clock[day].stop = detail.time;
    ref.child(`${this.uid}/clock`).set(this.clock);
  }

  _onClick() {
    if (this.hasAttribute('toggled')) {
      ref.child(`${this.uid}/on`).set(0);
    } else {
      ref.child(`${this.uid}/on`).set(1);
    }
  }

  _onChange() {
    ref.child(`${this.uid}/dim`).set(this.input.value);
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        width: 320px;
        height: 320px;
        align-items: center;
        box-sizing: border-box;
        padding: 12px 8px;
        border-radius: 15px;

	border: 1px solid #e4e4e4;
//        box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14),
//                    0 1px 18px 0 rgba(0, 0, 0, 0.12),
//                    0 3px 5px -1px rgba(0, 0, 0, 0.4);
      }
      h2, h4 {
        margin: 0;
        text-transform: uppercase;
      }
      .flex {
        flex: 1;
      }
      .flex-2 {
        flex: 2;
      }
      .flex-3 {
        flex: 3;
      }
      .title-bar {
        height: 32px;
      }
      custom-svg-icon {
        height: 32px;
        width: 32px;
        cursor: pointer;
        pointer-events: auto;
      }
      custom-svg-icon[icon="clock"] {
        pointer-events: none;
        width: 24px;
        height: 24px;
        padding-right: 8px;
      }
      :host([toggled]) custom-svg-icon[icon="lightbulb"] {
        fill: rgb(94, 146, 199);
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
      }
      input[type=range] {
        height: 24px;
        -webkit-appearance: none;
        margin: 0;
        width: 100%;
      }
      input[type=range]:focus {
        outline: none;
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 16px;
        cursor: pointer;
        animate: 0.2s;
        box-shadow: 1px 1px 2px 1px #948d8d8f;
        background: #3071A9;
        border-radius: 50px;
        border: 0px solid #A1A1A1;
      }
      input[type=range]::-webkit-slider-thumb {
        box-shadow: 1px 1px 2px 1px #948d8d8f;
        height: 24px;
        width: 24px;
        border-radius: 50%;
        background: #FFFFFF;
        cursor: pointer;
        -webkit-appearance: none;
        margin-top: -4px;
      }
      input[type=range]:focus::-webkit-slider-runnable-track {
        background: #3071A9;
      }
      input[type=range]::-moz-range-track {
        width: 100%;
        height: 16px;
        cursor: pointer;
        animate: 0.2s;
        box-shadow: 1px 1px 2px 1px #948d8d8f;
        background: #3071A9;
        border-radius: 50px;
        border: 0px solid #A1A1A1;
      }
      input[type=range]::-moz-range-thumb {
        box-shadow: 1px 1px 2px 1px #948d8d8f;
        height: 26px;
        width: 26px;
        border-radius: 50%;
        background: #FFFFFF;
        cursor: pointer;
        margin-top: -4px;
      }
      custom-svg-icon[icon="clock"] {
        fill: #888;
      }
      time-picker {
        box-shadow: none;
        --clock-container-background: #1c313a;
      }
      time-picker.picker-opened {
        box-shadow: 0 14px 45px rgba(0, 0, 0, 0.25), 0 10px 18px rgba(0, 0, 0, 0.22);
      }
      .time-row {
        height: 32px;
        align-items: center;
      }
    </style>
    <span class="row title-bar">
      <h2>${'name'}</h2>
      <span class="flex"></span>
      <custom-svg-icon icon="lightbulb"></custom-svg-icon>
    </span>

    <span class="flex-3"></span>

    <span class="row time-row">
      <custom-svg-icon icon="clock"></custom-svg-icon>
      <strong>on</strong>
      <span class="flex"></span>
      <time-picker class="start" hour="18" minutes="15"></time-picker>
    </span>
    <span class="row time-row">
      <custom-svg-icon icon="clock"></custom-svg-icon>
      <strong>off</strong>
      <span class="flex"></span>
      <time-picker class="end" hour="18" minutes="15"></time-picker>
    </span>

    <span class="flex"></span>
    <day-selector attr-for-selected="day"></day-selector>
    <span class="flex-2"></span>
    `;
  }

})
