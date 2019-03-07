/**
 * @extends HTMLElement
 */
((base = HTMLElement) => {
  window.svgIconset = window.svgIconset || {};

  customElements.define('custom-svg-iconset', class CustomSvgIconset extends base {
    /**
     * Attributes to observe
     *
     * Updates the js prop value with related attribute value
     * @return {array} ['name', 'theme', size]
     */
    static get observedAttributes() {
      return ['name', 'theme', 'size'];
    }
    /**
     * Runs whenever inserted into document
     */
    constructor() {
      super();
    }
    connectedCallback() {
      if (!this.hasAttribute('name')) {
        this.name = this.name;
      }
      this.style.display = 'none';
    }
    // Getters
    /**
     * The name of the iconset
     * @default {string} icons
     */
    get name() {
      return this._name || 'icons';
    }
    /**
     * The theme for the iconset
     * @default {string} light
     * @return {string}
     */
    get theme() {
      return this._theme || 'light';
    }
    /**
     * The size for the icons
     * @default {number} 24
     * @return {number}
     */
    get size() {
      return this._size || 24;
    }
    // Setters
    /**
     * Creates the iconset[name] in window
     */
    set name(value) {
      if (this._name !== value) {
        this._name = value;
        window.svgIconset[value] = {host: this, theme: this.theme};
        window.dispatchEvent(new CustomEvent('svg-iconset-update'));
        window.dispatchEvent(new CustomEvent('svg-iconset-added', {detail: value}));
      }
    }
    /**
     * Reruns applyIcon whenever a change has been detected
     */
    set theme(value) {
      if (this._theme !== value && this.name) {
        window.svgIconset[this.name] = {host: this, theme: value};
        window.dispatchEvent(new CustomEvent('svg-iconset-update'));
      }
      this._theme = value;
    }
    /**
     * @private
     */
    set size(value) {
      this._size = value;
    }
    /**
     * Runs whenever given attribute in observedAttributes has changed
     * @private
     */
    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal !== newVal) {
        this[name] = newVal;
      }
    }
    /* from https://github.com/PolymerElements/iron-iconset-svg */
    /**
     * Applies an icon to given element
     * @param {HTMLElement} element the element appending the icon to
     * @param {string} icon The name of the icon to show
     */
    applyIcon(element, icon) {
      element = element.shadowRoot || element;
      this.removeIcon(element);
      this._cloneIcon(icon).then(icon => {
        element.insertBefore(icon, element.childNodes[0]);
        element._iconSetIcon = icon;
      });
    }
    /**
     * Remove an icon from the given element by undoing the changes effected
     * by `applyIcon`.
     *
     * @param {Element} element The element from which the icon is removed.
     */
    removeIcon(element) {
      // Remove old svg element
      element = element.shadowRoot || element;
      if (element._iconSetIcon) {
        element.removeChild(element._iconSetIcon);
        element._iconSetIcon = null;
      }
    }
    /**
     * Produce installable clone of the SVG element matching `id` in this
     * iconset, or `undefined` if there is no matching element.
     *
     * @return {Element} Returns an installable clone of the SVG element
     * matching `id`.
     * @private
     */
    _cloneIcon(id) {
      return new Promise((resolve, reject) => {
        // create the icon map on-demand, since the iconset itself has no discrete
        // signal to know when it's children are fully parsed
        try {
          this._icons = this._icons || this._createIconMap();
          let svgClone = this._prepareSvgClone(this._icons[id], this.size);
          resolve(svgClone);
        } catch (error) {
          reject(error);
        }
      });
    }
    // TODO: Update icon-map on child changes
    /**
     * Create a map of child SVG elements by id.
     *
     * @return {!Object} Map of id's to SVG elements.
     * @private
     */
    _createIconMap() {
      var icons = Object.create(null);
      this.querySelectorAll('[id]')
        .forEach(icon => {
          icons[icon.id] = icon;
        });
      return icons;
    }
    /**
     * @private
     */
    _prepareSvgClone(sourceSvg, size) {
      if (sourceSvg) {
        var content = sourceSvg.cloneNode(true),
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
            viewBox = content.getAttribute('viewBox') || '0 0 ' + size + ' ' + size,
            cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.cssText = cssText;
        svg.appendChild(content).removeAttribute('id');
        return svg;
      }
      return null;
    }
  });
})();

(function () {

class TimePickerHour extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.root.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      left: 50%;
      width: 36px;
      height: 36px;
      margin: -18px;
      cursor: pointer;
      will-change: transform;
      border-radius: 50%;
      z-index: 0;
      user-select: none;
    }
    .bubble {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      z-index: 0;
      opacity: 0;
      transition: transform ease-out 64ms, opacity ease-out 16ms;
    }
    :host(:hover) .bubble {
      opacity: 1;
      background: var(--primary-color, #00bcd4);
      transform: translate(-50%, -50%) scale(1);
      transition: transform ease-in 100ms, opacity ease-in 16ms;
    }
    .container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
  </style>
  <slot></slot>
  <div class="bubble"></div>
  <div class="container"></div>
    `;
    this._onClick= this._onClick.bind(this);
    this._renderHour = this._renderHour.bind(this);
  }

  set digitValue(value) {
    if (value) {
      this.setAttribute('digit-value', value);
    } else {
      this.removeAttribute('digit-value');
    }
  }

  set timeFormat(value) {
    this._timeFormat = value;
    this._renderHour();
  }

  get timeFormat() {
    return this._timeFormat || 'am';
  }

  get _container() {
    return this.root.querySelector('.container');
  }

  set hour(value) {
    this._hour = value;
    this._renderHour();
  }

  set plateSize(value) {
    this._plateSize = value;
  }

  get hour() {
    return this._hour;
  }

  get plateSize() {
    return this._plateSize || 200;
  }

  connectedCallback() {
    this.addEventListener('click', this._onClick);
    this.addEventListener('mouseover', this._mouseOver);
  }

  transform(deg) {
    let x = this.plateSize / 2;
    this.style.transform = `rotate(${deg}deg) translate(${x}px) rotate(-${deg}deg)`;
  }

  _renderHour() {
    let hour = this.hour;
    if (this.timeFormat !== 'am') {
      hour += 12;
    }
    this._container.innerHTML = hour;
    this.digitValue = hour;
  }

  _onClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent('hour-select', {
      detail: this.hour
    }));
  }

  _mouseOver(event) {
    this.dispatchEvent(new CustomEvent('hour-indicating', {
      detail: {
        target: this,
        hour: Number(this.hour)
      }
    }));
  }
}
customElements.define('time-picker-hour', TimePickerHour);

class TimePickerPlate extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.root.innerHTML = `
  <style>
    :host {
      position: relative;
      width: var(--time-picker-plate-size, 200px);
      height: var(--time-picker-plate-size, 200px);
      padding: 0;
      border-radius: 50%;
      list-style: none;
      font-size: 14px;
      line-height: 36px;
      padding: var(--time-picker-plate-padding, 160px 0 20px 0);
      margin: 0 auto;
    }
    :host::before {
     content: "";
     position: absolute;
     top: 0;
     left: -20px;
     width: 240px;
     height: 240px;
     background: var(--clock-background);
     border-radius: 50%;
   }
   .center {
     position: absolute;
     left: 50%;
     top: 50%;
     transform: translate(-50%, -50%);
     width: 10px;
     height: 10px;
     border-radius: 50%;
     background: var(--primary-color, #00bcd4);
   }
   .indicator {
    position: absolute;
    top: 80px;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    height: 86px;
    width: 2px;
    background: var(--primary-color, #00bcd4);
   }
   .indicator.show {
     opacity: 1;
   }
  </style>
  <div class="indicator"></div>
  <div class="center"></div>
    `;
  }

  set size(value) {
    this._size = value;
    this.style.setPropertyValue('--time-picker-plate-size', `${value}px`);
  }

	set timeFormat(value) {
		this._timeFormat = value;
    this._notifyTimePickerHourElements(value);
	}

  get size() {
    return this._size || 200;
  }

  /**
   * Returns current time format, options are 'am', 'pm' or 24 hours
   * @return {String|Number}
   */
  get timeFormat() {
		return this._timeFormat || 'am';
	}

  get _indicator() {
    return this.root.querySelector('.indicator');
  }

  get renderTwentyFourHoursNeeded() {
    if (this.timeFormat !== 'am' || this.timeFormat !== 'pm') {
      return true;
    }
    return false;
  }

  _notifyTimePickerHourElements(timeFormat) {
    const hourElements = document.querySelectorAll('time-picker-hour');
    for (let hourElement  of hourElements) {
      hourElement.timeFormat = timeFormat;
    }
  }
}
customElements.define('time-picker-plate', TimePickerPlate);

class TimePickerHourPlate extends TimePickerPlate {
  constructor() {
    super();
    this._onHourSelect = this._onHourSelect.bind(this);
    this._onHourIndicating = this._onHourIndicating.bind(this);
    this._onHourMouseOut = this._onHourMouseOut.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupHours();
  }

  get hourSet() {
    return [
      [3, 0, 90],
      [4, 30, 120],
      [5, 60, 150],
      [6, 90, 180],
      [7, 120, 210],
      [8, 150, 240],
      [9, 180, 270],
      [10, 210, 300],
      [11, 240, 330],
      [12, 270, 0],
      [1, 300, 30],
      [2, 330, 60]
    ];
  }

  _setupHours() {
    let twentyFourHours = this.renderTwentyFourHoursNeeded;
    let hours = this.hourSet;
    // Promise.all([hourTasks])
    for (let hour of hours) {
      let timePickerHour = new TimePickerHour();
      timePickerHour.transform(hour[1]);
      timePickerHour.hour = hour[0];
      timePickerHour.plateSize = this.size;
      timePickerHour.addEventListener('hour-select',
        this._onHourSelect
      );
      timePickerHour.addEventListener('hour-indicating', this._onHourIndicating);
      timePickerHour.addEventListener('mouseout', this._onHourMouseOut);

      requestAnimationFrame(() => {
        this.root.appendChild(timePickerHour);
      });

      if (twentyFourHours) {
        hour[0] = (hour[0] + 12);
        let europeanTimePickerHour = new TimePickerHour();
        europeanTimePickerHour.plateSize = (this.size - 72);
        europeanTimePickerHour.transform(hour[1]);
        europeanTimePickerHour.hour = hour[0];
        europeanTimePickerHour.addEventListener('hour-select',
          this._onHourSelect);
        europeanTimePickerHour.addEventListener('hour-indicating',
          this._onHourIndicating);
        europeanTimePickerHour.addEventListener('mouseout', this._onHourMouseOut);

        requestAnimationFrame(() => {
          this.root.appendChild(europeanTimePickerHour);
        });
      }
    }
  }

  _querySelectDigit(number) {
    let query = `time-picker-hour[digit-value="${number}"]`;
    return this.root.querySelector(query);
  }

  _onHourIndicating(event) {
    let hour = event.detail.hour;
    let height = 86;
    let top = 80;
    let digitOverIndicator;
    if (hour > 12) {
      hour -= 12;
      height -= 36;
      top += 18;
    } else {
      // set the current digit the hide
      digitOverIndicator = hour;
      digitOverIndicator += 12;
    }
    this._hideDigitUnderIndicator(digitOverIndicator);
    this._rerenderIndicator(hour, height, top);
    this._indicator.classList.add('show');
  }

  _hideDigitUnderIndicator(digit) {
    if (digit) {
      digit = this._querySelectDigit(digit);
      digit.style.opacity = 0;
      this._lastUnderIndicator = digit;
    }
  }

  _rerenderIndicator(_hour, height, top) {
    for (let hour of this.hourSet) {
      let marginTop = 0;
      let marginLeft = 0;
      if (hour[0] === _hour) {
        if (hour[0] >= 1 && hour[0] < 3) {
          marginLeft = '-1px';
        } else if (hour[0] === 3) {
          marginTop = '-2px';
        } else if (hour[0] > 3 && hour[0] < 6) {
          marginTop = '-2px';
          marginLeft = '-2px';
        } else if (hour[0] === 6) {
          marginLeft = '-2px';
        } else if (hour[0] > 6 && hour[0] < 9) {
          marginTop = `-3px`;
          marginLeft = '-3px';
        } else if (hour[0] === 9) {
          marginTop = `-4px`;
        } else if (hour[0] > 9 && hour[0] < 12) {
          marginTop = `-3px`;
        }
        requestAnimationFrame(() => {
          this._indicator.style.marginLeft = marginLeft;
          this._indicator.style.marginTop = marginTop;
          this._indicator.style.height = `${height}px`;
          this._indicator.style.top = `${top}px`;
          this._indicator.style.transform = `rotate(${hour[2]}deg) translate(-50%, -50%)`;
        });
      }
    }
  }

  _onHourMouseOut() {
    this._indicator.classList.remove('show');
    if (this._lastUnderIndicator) {
      this._lastUnderIndicator.style.opacity = 1;
      this._lastUnderIndicator = undefined;
    }
  }

  _onHourSelect(event) {
    this.dispatchEvent(new CustomEvent('update-hour', {detail: event.detail}));
  }
}
customElements.define('time-picker-hour-plate', TimePickerHourPlate);

class TimePickerMinutesPlate extends TimePickerPlate {
  constructor() {
    super();

    this._onHourSelect = this._onHourSelect.bind(this);
    this._onHourIndicating = this._onHourIndicating.bind(this);
    this._onHourMouseOut = this._onHourMouseOut.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupMinutes();
  }

  set size(value) {
    super.size = value;
    this._size = value;
    this.style.setPropertyValue('--time-picker-plate-size', `${value}px`);
  }

  get size() {
    return this._size || 200;
  }

  get _indicator() {
    return this.root.querySelector('.indicator');
  }

  get minutesSet() {
    return [
      [15, 0, 90],
      [16, 6, 96],
      [17, 12, 102],
      [18, 18, 108],
      [19, 24, 114],
      [20, 30, 120],
      [21, 36, 126],
      [22, 42, 132],
      [23, 48, 138],
      [24, 54, 144],
      [25, 60, 150],
      [26, 66, 156],
      [27, 72, 162],
      [28, 78, 168],
      [29, 84, 174],
      [30, 90, 180],
      [31, 96, 186],
      [32, 102, 192],
      [33, 108, 198],
      [34, 114, 204],
      [35, 120, 210],
      [36, 126, 216],
      [37, 132, 222],
      [38, 138, 228],
      [39, 144, 234],
      [40, 150, 240],
      [41, 156, 246],
      [42, 162, 252],
      [43, 168, 258],
      [44, 174, 264],
      [45, 180, 270],
      [46, 186, 276],
      [47, 192, 282],
      [48, 198, 288],
      [49, 204, 294],
      [50, 210, 300],
      [51, 216, 306],
      [52, 222, 312],
      [53, 228, 318],
      [54, 234, 324],
      [55, 240, 330],
      [56, 246, 336],
      [57, 252, 342],
      [58, 258, 348],
      [59, 264, 354],
      [60, 270, 0],
      [1, 276, 6],
      [2, 282, 12],
      [3, 288, 18],
      [4, 294, 24],
      [5, 300, 30],
      [6, 306, 36],
      [7, 312, 42],
      [8, 318, 48],
      [9, 324, 54],
      [10, 330, 60],
      [11, 336, 66],
      [12, 342, 72],
      [13, 348, 78],
      [14, 354, 84]
    ];
  }

  _setupMinutes() {
    let hours = this.minutesSet;
    // Promise.all([hourTasks])
    for (let hour of hours) {
      let timePickerHour = new TimePickerHour();
      timePickerHour.transform(hour[1]);
      timePickerHour.hour = hour[0];
      timePickerHour.plateSize = this.size;
      if (hour[0] !== 5 && hour[0] !== 10 && hour[0] !== 15 &&
          hour[0] !== 20 && hour[0] !== 25 && hour[0] !== 30 &&
          hour[0] !== 35 && hour[0] !== 40 && hour[0] !== 45 &&
          hour[0] !== 50 && hour[0] !== 55 && hour[0] !== 60) {
        timePickerHour.root.querySelector('.container').innerHTML = '';
        timePickerHour.style.width = '18px';
        timePickerHour.style.height = '18px';
        timePickerHour.style.margin = '-9px';
      } else {
        timePickerHour.hour = hour[0];
      }
      timePickerHour.addEventListener('hour-select',
        this._onHourSelect
      );
      timePickerHour.addEventListener('hour-indicating', this._onHourIndicating);
      timePickerHour.addEventListener('mouseout', this._onHourMouseOut);

      requestAnimationFrame(() => {
        this.root.appendChild(timePickerHour);
      });
    }
  }

  _onHourIndicating(event) {
    let hour = event.detail.hour;
    this._rerenderIndicator(hour);
    this._indicator.classList.add('show');
  }

  _rerenderIndicator(_minute) {
    for (let minute of this.minutesSet) {
      let marginTop = 0;
      let marginLeft = 0;
      if (minute[0] === _minute) {
        if (minute[0] >= 5 && minute[0] < 15) {
          marginLeft = '-1px';
        } else if (minute[0] === 15) {
          marginTop = '-2px';
        } else if (minute[0] > 15 && minute[0] < 30) {
          marginTop = '-2px';
          marginLeft = '-2px';
        } else if (minute[0] === 30) {
          marginLeft = '-2px';
        } else if (minute[0] > 30 && minute[0] < 45) {
          marginTop = `-3px`;
          marginLeft = '-3px';
        } else if (minute[0] === 45) {
          marginTop = `-4px`;
        } else if (minute[0] > 45 && minute[0] < 60) {
          marginTop = `-3px`;
        }
        requestAnimationFrame(() => {
          this._indicator.style.marginLeft = marginLeft;
          this._indicator.style.marginTop = marginTop;
          this._indicator.style.transform = `rotate(${minute[2]}deg) translate(-50%, -50%)`;
        });
      }
    }
  }

  _onHourMouseOut() {
    this._indicator.classList.remove('show');
  }

  _onHourSelect(event) {
    this.dispatchEvent(new CustomEvent('update-minutes', {detail: event.detail}));
  }
}
customElements.define('time-picker-minutes-plate', TimePickerMinutesPlate);

class WebClockLite extends HTMLElement {
  static get observedAttributes() {
    return ['hour', 'minutes'];
  }
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.root.innerHTML = `
  <style>
    :host {
      display: flex;
      height: 40px;
      align-items: center;
      flex-direction: row;
      padding: 8px;
      box-sizing: border-box;
      color: var(--web-clock-color, #555);
      cursor: default;
    }
    :host([picker]) {
      cursor: pointer;
    })
    :host([picker-opened]) {
      opacity: 0;
      pointer-events: none;
    }
    .hour, .minutes {
      padding: 0 8px;
    }
  </style>
  <div class="hour"></div>
  <span class="indicator">:</span>
  <div class="minutes"></div>
    `;
  }

  get time() {
    return `${this.hour}:${this.minutes}`;
  }

  get hour() {
    return this._hour;
  }

  get minutes() {
    return this._minutes;
  }

  set hour(value) {
    this._applyTimeUpdate('.hour', value);
    this._hour = value;
  }

  set minutes(value) {
    this._applyTimeUpdate('.minutes', value);
    this._minutes = value;
  }

  _applyTimeUpdate(query, value) {
    let target = this.root.querySelector(query);
    requestAnimationFrame(() => {
      target.innerHTML = value;
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this[name] = newValue;
  }
}
customElements.define('web-clock-lite', WebClockLite);

// TODO: Cleanup & add settings menu
/**
 * @extends HTMLElement
 */
class TimePicker extends HTMLElement {
  /**
   * Attributes to observer
   * @return {Array} []
   */
  static get observedAttributes() {
    return ['no-clock', 'hour', 'minutes'];
  }

  /**
   * Calls super
   */
  constructor() {
   super();
   this.root = this.attachShadow({mode: 'open'});
   this._onUpdateHour = this._onUpdateHour.bind(this);
   this._onUpdateMinutes = this._onUpdateMinutes.bind(this);
   this._onWebClockClick = this._onWebClockClick.bind(this);
   this._onHourClick = this._onHourClick.bind(this);
   this._onMinutesClick = this._onMinutesClick.bind(this);
   this._onOk = this._onOk.bind(this);
   this._onCancel = this._onCancel.bind(this);
  }

  /**
   * Stamps innerHTML
   */
  connectedCallback() {
    this.root.innerHTML = `
       <style>
         :host {
           display: flex;
           align-items: center;
           justify-content: center;
           height: 40px;
           width: 80px;
					 box-shadow: 0 14px 45px rgba(0, 0, 0, 0.25),
					 						 0 10px 18px rgba(0, 0, 0, 0.22);
					 background: #FFF;
           --time-picker-plate-size: 200px;
           --time-picker-plate-padding: 22px 0 20px 0;
           transition: transform ease-out 160ms, opacity ease-out 160ms, scale ease-out 160ms;
           transform-origin: top left;
           will-change: transform, height, width, opacity;
           --primary-color: #00bcd4;
           --primary-text-color: #555;
           --clock-container-background: var(--primary-color);
         }
				 .backdrop {
					 position: absolute;
					 top: 0;
					 left: 0;
				 }
         .am-pm, .actions, time-picker-hour-plate, time-picker-minutes-plate {
           width: 0;
           height: 0;
           opacity: 0;
           margin: 0;
           padding: 0;
           pointer-events: none;
         }
         time-picker-hour-plate, time-picker-minutes-plate {
           display: none;
         }
         :host([show-on-demand]), :host([show-on-demand]) .clock-container {
					 opacity: 0;
           height: 0;
           width: 0;
         }
         :host(.no-clock) {
           opacity: 0;
           pointer-events: none;
           width: 0;
           height: 0;
         }
				 :host([show-on-demand] .picker-opened) :host(.picker-opened) {
				 	 opacity: 1;
				 }
         :host(.picker-opened) .clock-container {
           display: flex;
           flex-direction: row;
           align-items: center;
           justify-content: center;
					 height: 64px;
					 width: 100%;
					 background: var(--clock-container-background);
           color: var(--clock-container-color);
           transition: background ease-in 300ms;
           pointer-events: auto;
         }
         :host(.picker-opened) {
           z-index: 100;
         }
				 .clock-container {
           box-sizing: border-box;
				 }
				.am-pm, .actions {
					display: flex;
					flex-direction: row;
				}
				.am-pm {
					align-items: flex-end;
          box-sizing: border-box;
				}
				.actions {
					align-items: center;
					box-sizing: border-box;
				}
				.am, .pm {
					height: 40px;
					width: 40px;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					background: var(--clock-background);
					text-transform: uppercase;
				}
				button {
					border: none;
					border-radius: 3px;
					text-transform: uppercase;
					padding: 8px;
					height: 40px;
					min-width: 100px;
					background: transparent;
					cursor: pointer;
					outline: none;
				}
				.flex {
					flex: 1;
				}
				.flex-2 {
					flex: 2;
				}
        :host(.picker-opened) {
          opacity: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: auto;
          max-width: 320px;
          box-shadow: 0 14px 45px rgba(0, 0, 0, 0.25),
          						 0 10px 18px rgba(0, 0, 0, 0.22);
          background: #FFF;
          --clock-background: rgba(0, 0, 0, 0.05);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: transform ease-in 300ms, opacity ease-in 300ms, scale ease-in 300ms;
        }
        :host(.picker-opened) .am-pm, :host(.picker-opened) .actions {
					height: 64px;
					width: 100%;
					padding: 8px 24px;
          pointer-events: auto;
        }
        :host(.picker-opened) .am-pm, :host(.picker-opened) .actions {
          opacity: 1;
        }
        :host(.picker-opened[hour-picker]) time-picker-hour-plate,
        :host(.picker-opened[minutes-picker]) time-picker-minutes-plate {
          opacity: 1;
          display: flex;
          margin: auto;
          width: var(--time-picker-plate-size);
          height: var(--time-picker-plate-size);
          padding: var(--time-picker-plate-padding);
          pointer-events: auto;
        }
       </style>
       <span class="clock-container">
         <web-clock-lite style="cursor: pointer;"></web-clock-lite>
       </span>
			 <div class="am-pm">
			 	 <span class="flex"></span>
			 	 <div class="am">am</div>
				 <span class="flex-2"></span>
				 <div class="pm">pm</div>
				 <span class="flex"></span>
			 </div>
       <time-picker-hour-plate></time-picker-hour-plate>
       <time-picker-minutes-plate></time-picker-minutes-plate>
			 <div class="actions">
        <button class="cancel">cancel</button>
        <span class="flex"></span>
        <button class="ok">ok</button>
			 </div>
    `;
    if (this.noClock === false) {
      this.webClock.addEventListener('click', this._onWebClockClick);
    }
    this.timeFormat = this.timeFormat;
    this.hourPicker = true;
  }

  get webClock() {
    return this.root.querySelector('web-clock-lite');
  }

  get plate() {
    return this.root.querySelector('time-picker-hour-plate');
  }

  get minutesPlate() {
    return this.root.querySelector('time-picker-minutes-plate');
  }

  get animations() {
    return {
      entry: {
        opacity: 1,
        transform: 'translateY(-50%) translateX(-50%) scale(1)'
      },
      out: {
        opacity: 1,
        transform: 'translateY(0) translateX(0) scale(1)'
      },
      shared: {
        translate: (x, y) => {
          return {opacity: '0.1', transform: `translateY(${y}px) translateX(${x}px) scale(0.1)`};
        }
      }
    }
  }

  get time() {
    return this._time || {hour: '8', minutes: '00'};
  }

  get cancelButton() {
    return this.root.querySelector('.cancel');
  }

  get okButton() {
    return this.root.querySelector('.ok');
  }

  get timeFormat() {
    return this._timeFormat || 24;
  }

  get noClock() {
    return this._noClock || false;
  }

  set opened(value) {
    this._opened = value;
  }

  get opened() {
    return this._opened;
  }

  set noClock(value) {
    this._noClock = value;
    if (value) {
      this.classList.add('no-clock');
    } else {
      this.classList.remove('no-clock');
    }
  }

  set hourPicker(value) {
    this._timeFormat = value;
    let plate = this.root.querySelector('time-picker-hour-plate');
    let minutesPlate = this.root.querySelector('time-picker-minutes-plate');
    if (value) {
      plate.addEventListener('update-hour', this._onUpdateHour);
      minutesPlate.removeEventListener('update-minutes', this._onUpdateMinutes);
      this.removeAttribute('minutes-picker');
      this.setAttribute('hour-picker', '');
    } else {
      plate.removeEventListener('update-hour', this._onUpdateHour);
      minutesPlate.addEventListener('update-minutes', this._onUpdateMinutes);
      this.removeAttribute('hour-picker');
      this.setAttribute('minutes-picker', '');
    }
  }

  set hour(value) {
    this._onUpdateHour(value);
  }

  set minutes(value) {
    this._onUpdateMinutes(value);
  }

  set time(value) {
    this._time = value;
    if (!this.webClockLiteReady) {
      customElements.whenDefined('web-clock-lite').then(() => {
        this._updateTime(value.hour, value.minutes);
        this.webClockLiteReady = true;
      });
      return;
    }
    this._updateTime(value.hour, value.minutes);
  }

  _updateTime(hour, minutes) {
    this.webClock.hour = hour;
    this.webClock.minutes = minutes;
    this.dispatchEvent(new CustomEvent('time-change', {detail: this.time}));
  }

  set timeFormat(value) {
    let amPm = this.root.querySelector('.am-pm');
    if (value !== 'am' && value !== 'pm') {
      amPm.style.opacity = 0;
      amPm.style.height = 0;
      amPm.style.pointerEvents = 'none';
    } else {
      amPm.style.opacity = 1;
      amPm.style.height = 'initial';
      amPm.style.pointerEvents = 'auto';
    }
    this.plate.timeFormat = value;
  }

  /**
   * Runs whenever attribute changes are detected
   * @param {string} name The name of the attribute that changed.
   * @param {string|object|array} oldValue
   * @param {string|object|array} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this[this._toJsProp(name)] = newValue;
		}
	}

  _onHourClick() {
    this.hourPicker = true;
  }

  _onMinutesClick() {
    this.hourPicker = false;
  }

  _onUpdateHour(event) {
    let hour = event.detail || event;
    let time = this.time;
    // place a 0 before the digit when length is shorter than 2
    hour = this._transformToTime(hour);
    time.hour = hour;
    this._notify('time', time);
  }

  _onUpdateMinutes(event) {
    let minutes = event.detail || event;
    let time = this.time;
    minutes = this._transformToTime(minutes);
    time.minutes = minutes;
    this._notify('time', time);
  }

  _transformToTime(number) {
    // place a 0 before the digit when needed
    if (String(number).length === 1) {
      return number = `0${number}`;
    }
    return number;
  }

  _notify(prop, value) {
    this[prop] = value;
  }

  _onWebClockClick(event) {
    event.preventDefault();
    if (this.opened) {
      return;
    }
    this.open();
  }

  open() {
    this.opened = true;
    this.flip(true);
  }

  flip(opened) {
    let animations;
    // Get the first position.
    var first = this.getBoundingClientRect();
    let hourEl = this.webClock.root.querySelector('.hour');
    let minutesEl = this.webClock.root.querySelector('.minutes');
    // Get the last position.
    if (opened) {
      hourEl.addEventListener('click', this._onHourClick);
      minutesEl.addEventListener('click', this._onMinutesClick);
      this.removeEventListener('click', this._onWebClockClick);
      this.okButton.addEventListener('click', this._onOk);
      this.cancelButton.addEventListener('click', this._onCancel);
      this.classList.add('picker-opened');
    } else {
      hourEl.removeEventListener('click', this._onHourClick);
      minutesEl.removeEventListener('click', this._onMinutesClick);
      this.addEventListener('click', this._onWebClockClick);
      this.okButton.removeEventListener('click', this._onOk);
      this.cancelButton.removeEventListener('click', this._onCancel);
      this.classList.remove('picker-opened');
    }
    var last = this.getBoundingClientRect();

    // Invert.
    let top = first.top - last.top;
    let left = first.left - last.left;
    if (opened) {
      let color = this.style.getPropertyValue('--primary-color');
      animations = [
        this.animations.shared.translate(left, top), this.animations.entry
      ];
      requestAnimationFrame(() => {
        this.style.setProperty('--clock-container-background', '#FFF');
      });
      requestAnimationFrame(() => {
        this.style.setProperty('--clock-container-background', color);
      });
      this.style.setProperty('--web-clock-color', '#FFF');
    } else {
      let textColor = this.style.getPropertyValue('--primary-text-color');
      animations = [
        this.animations.shared.translate(left, top), this.animations.out
      ];
      this.style.setProperty('--web-clock-color', textColor);
    }
    // Go from the inverted position to last.
    var player = this.animate(animations, {
      duration: 300,
      easing: 'cubic-bezier(0,0,0.32,1)',
    });
    // Do any tidy up at the end
    // of the animation.
    player.addEventListener('finish', () => {
      // Workaround for blurry hours bug.
      if (opened) requestAnimationFrame(() => {
        this.style.display = 'block';
        this.plate.style.display = 'block';
        this.minutesPlate.style.display = 'block';
      });
      else requestAnimationFrame(() => {
        this.style.display = 'flex';
        this.plate.style.display = 'block';
        this.minutesPlate.style.display = 'block';
      });
    });
  }

  _onOk(event) {
    event.stopPropagation();
    event.preventDefault();
    this.close('ok');
  }

  _onCancel(event) {
    event.stopPropagation();
    event.preventDefault();
    this.close('cancel');
  }

  close(action) {
    this.opened = false;
    this.flip(false);
    this.dispatchEvent(new CustomEvent('time-picker-action', {
      detail: {
        action: action,
        time: this.time
      }
    }));
  }

  _toJsProp(string) {
    var parts = string.split('-');
    if (parts.length > 1) {
      var upper = parts[1].charAt(0).toUpperCase();
      string =  parts[0] + upper + parts[1].slice(1).toLowerCase();
    }
    return string;
  }
}
customElements.define('time-picker', TimePicker);

}());

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
    await import('./custom-svg-icon-8ae74ff5.js');
    await import('./rrda-device-13bca74c.js');
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

var client = new RRDAClient();

export { client as default };
