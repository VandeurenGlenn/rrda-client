export default customElements.define('custom-date', class CustomDate extends HTMLElement {

  static get observedAttributes() {
    return ['day', 'month', 'year', 'date', 'value'];
  }

  get months() {
    return  ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  }

  get days() {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  }

  set value(value) {
    this._value = value;
    this.setAttribute('value', value);
    const date = new Date(Number(value));
    this.day = date.getDay();
    this.date = date.getDate();
    this.month = date.getMonth();
    this.year = date.getFullYear();
  };

  set day(value) {
    this._day = value;
    this.setAttribute('day', value);
  }

  set month(value) {
    this._month = value;
    this.setAttribute('month', value);
  }

  set date(value) {
    this._date = value;
    this.setAttribute('date', value);
  }

  set year(value) {
    this._year = value;
    this.setAttribute('year', value);
  }

  get day() {
    return this._day;
  }

  get month() {
    return this._month;
  }

  get date() {
    return this._date;
  }

  get year() {
    return this._year;
  }

  attributeChangedCallback(name, oldValue, value) {
    if (oldValue !== value && value) {
      this[name] = value;

      this.observer();
    }

  }

  observer() {
    if (this.day && this.date && this.month && this.year) {
      this.render()
    }
  }

  render() {
    this.innerHTML = `
    <style>
      custom-date {
        display: flex;
        width: 110px;
      }
    </style>

    <div>${this.days[this.day]}</div>
    <span class="flex"></span>
    <div>${this.date}</div>

    <span class="flex"></span>
    <div>${this.months[this.month]}</div>

    <span class="flex"></span>
    <div>${this.year}</div>
    `;
  }

  constructor() {
    super();
  }

  connectedCallback() {
    if (!this.getAttribute('value')) {
      this.value = new Date().getTime();
    }
  }
})
