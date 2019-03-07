import { a as define, b as RenderMixin } from './chunk-157bcacb.js';

/**
 * @mixin Backed
 * @module utils
 * @export merge
 *
 * some-prop -> someProp
 *
 * @param {object} object The object to merge with
 * @param {object} source The object to merge
 * @return {object} merge result
 */
var merge = (object = {}, source = {}) => {
  // deep assign
  for (const key of Object.keys(object)) {
    if (source[key]) {
      Object.assign(object[key], source[key]);
    }
  }
  // assign the rest
  for (const key of Object.keys(source)) {
    if (!object[key]) {
      object[key] = source[key];
    }
  }
  return object;
};

window.Backed = window.Backed || {};
// binding does it's magic using the propertyStore ...
window.Backed.PropertyStore = window.Backed.PropertyStore || new Map();

// TODO: Create & add global observer
var PropertyMixin = base => {
  return class PropertyMixin extends base {
    static get observedAttributes() {
      return Object.entries(this.properties).map(entry => {if (entry[1].reflect) {return entry[0]} else return null});
    }

    get properties() {
      return customElements.get(this.localName).properties;
    }

    constructor() {
      super();
      if (this.properties) {
        for (const entry of Object.entries(this.properties)) {
          const { observer, reflect, renderer } = entry[1];
          // allways define property even when renderer is not found.
          this.defineProperty(entry[0], entry[1]);
        }
      }
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      if (this.attributes)
        for (const attribute of this.attributes) {
          if (String(attribute.name).includes('on-')) {
            const fn = attribute.value;
            const name = attribute.name.replace('on-', '');
            this.addEventListener(String(name), event => {
              let target = event.path[0];
              while (!target.host) {
                target = target.parentNode;
              }
              if (target.host[fn]) {
                target.host[fn](event);
              }
            });
          }
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      this[name] = newValue;
    }

    /**
     * @param {function} options.observer callback function returns {instance, property, value}
     * @param {boolean} options.reflect when true, reflects value to attribute
     * @param {function} options.render callback function for renderer (example: usage with lit-html, {render: render(html, shadowRoot)})
     */
    defineProperty(property = null, {strict = false, observer, reflect = false, renderer, value}) {
      Object.defineProperty(this, property, {
        set(value) {
          if (value === this[`___${property}`]) return;
          this[`___${property}`] = value;

          if (reflect) {
            if (value) this.setAttribute(property, String(value));
            else this.removeAttribute(property);
          }

          if (observer) {
            if (observer in this) this[observer]();
            else console.warn(`observer::${observer} undefined`);
          }

          if (renderer) {
            const obj = {};
            obj[property] = value;
            if (renderer in this) this.render(obj, this[renderer]);
            else console.warn(`renderer::${renderer} undefined`);
          }

        },
        get() {
          return this[`___${property}`];
        },
        configurable: strict ? false : true
      });
      // check if attribute is defined and update property with it's value
      // else fallback to it's default value (if any)
      const attr = this.getAttribute(property);
      this[property] = attr || this.hasAttribute(property) || value;
    }
  }
};

var SelectMixin = base => {
  return class SelectMixin extends PropertyMixin(base) {

    static get properties() {
      return merge(super.properties, {
        selected: {
          value: 0,
          observer: '__selectedObserver__'
        }
      });
    }

    constructor() {
      super();
    }

    get slotted() {
      return this.shadowRoot ? this.shadowRoot.querySelector('slot') : this;
    }

    get _assignedNodes() {
      return 'assignedNodes' in this.slotted ? this.slotted.assignedNodes() : this.children;
    }

    /**
    * @return {String}
    */
    get attrForSelected() {
      return this.getAttribute('attr-for-selected') || 'name';
    }

    set attrForSelected(value) {
      this.setAttribute('attr-for-selected', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        // check if value is number
        if (!isNaN(newValue)) {
          newValue = Number(newValue);
        }
        this[name] = newValue;
      }
    }

    /**
     * @param {string|number|HTMLElement} selected
     */
    select(selected) {
      if (selected) this.selected = selected;
      // TODO: fix selectedobservers
      if (this.multi) this.__selectedObserver__();
    }

    next(string) {
      const index = this.getIndexFor(this.currentSelected);
      if (index !== -1 && index >= 0 && this._assignedNodes.length > index &&
          (index + 1) <= this._assignedNodes.length - 1) {
        this.selected = this._assignedNodes[index + 1];
      }
    }

    previous() {
      const index = this.getIndexFor(this.currentSelected);
      if (index !== -1 && index >= 0 && this._assignedNodes.length > index &&
          (index - 1) >= 0) {
        this.selected = this._assignedNodes[index - 1];
      }
    }

    getIndexFor(element) {
      if (element && element instanceof HTMLElement === false)
        return console.error(`${element} is not an instanceof HTMLElement`);

      return this._assignedNodes.indexOf(element || this.selected);
    }

    _updateSelected(selected) {
      selected.classList.add('custom-selected');
      if (this.currentSelected && this.currentSelected !== selected) {
        this.currentSelected.classList.remove('custom-selected');
      }
      this.currentSelected = selected;
    }

    /**
     * @param {string|number|HTMLElement} change.value
     */
    __selectedObserver__(value) {
      const type = typeof this.selected;
      if (Array.isArray(this.selected)) {
        for (const child of this._assignedNodes) {
          if (child.nodeType === 1) {
            if (this.selected.indexOf(child.getAttribute(this.attrForSelected)) !== -1) {
              child.classList.add('custom-selected');
            } else {
              child.classList.remove('custom-selected');
            }
          }
        }
        return;
      } else if (type === 'object') return this._updateSelected(this.selected);
      else if (type === 'string') {
        for (const child of this._assignedNodes) {
          if (child.nodeType === 1) {
            if (child.getAttribute(this.attrForSelected) === this.selected) {
              return this._updateSelected(child);
            }
          }
        }
      } else {
        // set selected by index
        const child = this._assignedNodes[this.selected];
        if (child && child.nodeType === 1) this._updateSelected(child);
        // remove selected even when nothing found, better to return nothing
      }
    }
  }
};

var SelectorMixin = base => {
  return class SelectorMixin extends SelectMixin(base) {

  static get properties() {
      return merge(super.properties, {
        selected: {
          value: 0,
          observer: '__selectedObserver__'
        },
        multi: {
          value: false,
          reflect: true
        }
      });
    }
    constructor() {
      super();
    }
    connectedCallback() {
      super.connectedCallback();
      this._onClick = this._onClick.bind(this);
      this.addEventListener('click', this._onClick);
    }
    disconnectedCallback() {
      this.removeEventListener('click', this._onClick);
    }
    _onClick(event) {
      const target = event.path[0];
      const attr = target.getAttribute(this.attrForSelected);
      let selected;

      if (target.localName !== this.localName) {
        selected = attr ? attr : target;
      } else {
        selected = attr;
      }
      if (this.multi) {
        if (!Array.isArray(this.selected)) this.selected = [];
        const index = this.selected.indexOf(selected);
        if (index === -1) this.selected.push(selected);
        else this.selected.splice(index, 1);
        // trigger observer
        this.select(this.selected);

      } else this.selected = selected;

      this.dispatchEvent(new CustomEvent('selected', { detail: selected }));
    }
  }
};

define(class DaySelector extends RenderMixin(SelectorMixin(HTMLElement)) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    for (const day of stateMachine.days) {
      this.innerHTML += `<span class="day" title="${day}" day="${day[0]}${day[1]}${day[2]}">${day[0]}</span>`;
    }
    this.attrForSelected= 'day';
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        height: 44px;
        width: 100%;
        justify-content: space-between;
        user-select: none;
      }

      ::slotted(.day) {
        border-radius: 50%;
        height: 36px;
        width: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eee;
        cursor: pointer;
        user-select: none;
      }

      ::slotted(.day.custom-selected) {
        background: #3071a9;
        color: #fff;
      }
    </style>

    <slot></slot>
    `;
  }
});

/**
 * @extends HTMLElement
 */
class CustomPages extends SelectMixin(HTMLElement) {
  constructor() {
    super();
    this.slotchange = this.slotchange.bind(this);
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          flex: 1;
          position: relative;
          --primary-background-color: #ECEFF1;
          overflow: hidden;
        }
        ::slotted(*) {
          display: flex;
          position: absolute;
          opacity: 0;
          pointer-events: none;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          transition: transform ease-out 160ms, opacity ease-out 60ms;
          /*transform: scale(0.5);*/
          transform-origin: left;
        }
        ::slotted(.animate-up) {
          transform: translateY(-120%);
        }
        ::slotted(.animate-down) {
          transform: translateY(120%);
        }
        ::slotted(.custom-selected) {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
          transition: transform ease-in 160ms, opacity ease-in 320ms;
          max-height: 100%;
          max-width: 100%;
        }
      </style>
      <!-- TODO: scale animation, ace doesn't resize that well ... -->
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', this.slotchange);
  }

  isEvenNumber(number) {
    return Boolean(number % 2 === 0)
  }

  /**
   * set animation class when slot changes
   */
  slotchange() {
    let call = 0;
    for (const child of this.slotted.assignedNodes()) {
      if (child && child.nodeType === 1) {
        child.style.zIndex = 99 - call;
        if (this.isEvenNumber(call++)) {
          child.classList.add('animate-down');
        } else {
          child.classList.add('animate-up');
        }
        this.dispatchEvent(new CustomEvent('child-change', {detail: child}));
      }
    }
  }
}customElements.define('custom-pages', CustomPages);

var rrdaDevice = define(class RrdaDevice extends RenderMixin(HTMLElement) {
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
    this.setAttribute('uid', value);
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
      this.shadowRoot.appendChild(input);
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
    this.startTimePicker.time = value[stateMachine.shortDays.indexOf(this.selected)].start;
    this.endTimePicker.time = value[stateMachine.shortDays.indexOf(this.selected)].stop;
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
    const today = stateMachine.shortDays[new Date().getDay()];
    this.button.addEventListener('click', this._onClick);
    this.startTimePicker.addEventListener('time-picker-action', this._onStartTimePicker);
    this.endTimePicker.addEventListener('time-picker-action', this._onEndTimePicker);
    this.daySelector.addEventListener('selected', this._onDaySelected);

    this.selected = today;
    // this.clock = JSON.parse(this.getAttribute('clock'));
    if (this.daySelector.rendered) this.daySelector.selected = today;
    else this.timeoutDaySelector();
  }

  timeoutDaySelector() {
    setTimeout(() => {
      if (this.daySelector.rendered) this.daySelector.selected = this.selected;
      else this.timeoutDaySelector();
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
    stateMachine.shortDays.indexOf(detail);
    const time = this.clock[stateMachine.shortDays.indexOf(detail)];
    this.startTimePicker.time = time.start;
    this.endTimePicker.time = time.stop;
  }

  _onStartTimePicker({detail}) {
    const day = stateMachine.shortDays.indexOf(this.selected);
    if (detail.action !== 'ok') return;
    this.clock[day].start = detail.time;
    ref.child(`${this.uid}/clock`).set(this.clock);
  }

  _onEndTimePicker({detail}) {
    const day = stateMachine.shortDays.indexOf(this.selected);
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

});

export default rrdaDevice;
