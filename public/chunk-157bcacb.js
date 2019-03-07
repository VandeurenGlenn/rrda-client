/**
 * Add space between camelCase text.
 */
var unCamelCase = (string) => {
  string = string.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2');
  string = string.toLowerCase();
  return string;
};

/**
* Replaces all accented chars with regular ones
*/
var replaceAccents = (string) => {
  // verifies if the String has accents and replace them
  if (string.search(/[\xC0-\xFF]/g) > -1) {
      string = string
              .replace(/[\xC0-\xC5]/g, 'A')
              .replace(/[\xC6]/g, 'AE')
              .replace(/[\xC7]/g, 'C')
              .replace(/[\xC8-\xCB]/g, 'E')
              .replace(/[\xCC-\xCF]/g, 'I')
              .replace(/[\xD0]/g, 'D')
              .replace(/[\xD1]/g, 'N')
              .replace(/[\xD2-\xD6\xD8]/g, 'O')
              .replace(/[\xD9-\xDC]/g, 'U')
              .replace(/[\xDD]/g, 'Y')
              .replace(/[\xDE]/g, 'P')
              .replace(/[\xE0-\xE5]/g, 'a')
              .replace(/[\xE6]/g, 'ae')
              .replace(/[\xE7]/g, 'c')
              .replace(/[\xE8-\xEB]/g, 'e')
              .replace(/[\xEC-\xEF]/g, 'i')
              .replace(/[\xF1]/g, 'n')
              .replace(/[\xF2-\xF6\xF8]/g, 'o')
              .replace(/[\xF9-\xFC]/g, 'u')
              .replace(/[\xFE]/g, 'p')
              .replace(/[\xFD\xFF]/g, 'y');
  }

  return string;
};

var removeNonWord = (string) => string.replace(/[^0-9a-zA-Z\xC0-\xFF \-]/g, '');

const WHITE_SPACES = [
    ' ', '\n', '\r', '\t', '\f', '\v', '\u00A0', '\u1680', '\u180E',
    '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
    '\u2007', '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F',
    '\u205F', '\u3000'
];

/**
* Remove chars from beginning of string.
*/
var ltrim = (string, chars) => {
  chars = chars || WHITE_SPACES;

  let start = 0,
      len = string.length,
      charLen = chars.length,
      found = true,
      i, c;

  while (found && start < len) {
      found = false;
      i = -1;
      c = string.charAt(start);

      while (++i < charLen) {
          if (c === chars[i]) {
              found = true;
              start++;
              break;
          }
      }
  }

  return (start >= len) ? '' : string.substr(start, len);
};

/**
* Remove chars from end of string.
*/
var rtrim = (string, chars) => {
  chars = chars || WHITE_SPACES;

  var end = string.length - 1,
      charLen = chars.length,
      found = true,
      i, c;

  while (found && end >= 0) {
      found = false;
      i = -1;
      c = string.charAt(end);

      while (++i < charLen) {
          if (c === chars[i]) {
              found = true;
              end--;
              break;
          }
      }
  }

  return (end >= 0) ? string.substring(0, end + 1) : '';
};

/**
 * Remove white-spaces from beginning and end of string.
 */
var trim = (string, chars) => {
  chars = chars || WHITE_SPACES;
  return ltrim(rtrim(string, chars), chars);
};

/**
 * Convert to lower case, remove accents, remove non-word chars and
 * replace spaces with the specified delimeter.
 * Does not split camelCase text.
 */
var slugify = (string, delimeter) => {
  if (delimeter == null) {
      delimeter = "-";
  }

  string = replaceAccents(string);
  string = removeNonWord(string);
  string = trim(string) //should come after removeNonWord
          .replace(/ +/g, delimeter) //replace spaces with delimeter
          .toLowerCase();
  return string;
};

/**
* Replaces spaces with hyphens, split camelCase text, remove non-word chars, remove accents and convert to lower case.
*/
var hyphenate = string => {
  string = unCamelCase(string);
  return slugify(string, "-");
};

const shouldRegister = name => {
  return customElements.get(name) ? false : true;
};

var define = klass => {
  const name = hyphenate(klass.name);
  return shouldRegister(name) ? customElements.define(name, klass) : '';
};

/**
 * @param {object} element HTMLElement
 * @param {function} tagResult custom-renderer-mixin {changes: [], template: ''}
 */
var render = (element, {changes, template}) => {
  if (!changes && !template) return console.warn('changes or template expected');
  if (element.shadowRoot) element = element.shadowRoot;
  if (!element.innerHTML) element.innerHTML = template;
  for (const key of Object.keys(changes)) {
    const els = Array.from(element.querySelectorAll(`[render-mixin-id="${key}"]`));
    for (const el of els) {
      el.innerHTML = changes[key];
    }
  }
  return;
};

/**
 *
 * @example
 ```js
  const template = html`<h1>${'name'}</h1>`;
  let templateResult = template({name: 'Olivia'});

  templateResult.values // property values 'Olivia'
  templateResult.keys // property keys 'name'
  templateResult.strings // raw template array '["<h1>", "</h1>"]'
 ```
 */
const html$1 = (strings, ...keys) => {
  return ((...values) => {
    return {strings, keys, values};
  });
};

window.html = window.html || html$1;

var RenderMixin = (base = HTMLElement) =>
class RenderMixin extends base {

  constructor() {
    super();
    this.set = [];
    this.renderer = this.renderer.bind(this);
    this.render = this.renderer;
  }

  beforeRender({values, strings, keys}) {
    const dict = values[values.length - 1] || {};
    const changes = {};
    let template = null;
    if (!this.rendered) template = strings[0];

    if (values[0] !== undefined) {
      keys.forEach((key, i) => {
        const string = strings[i + 1];
        let value = Number.isInteger(key) ? values[key] : dict[key];
        if (value === undefined && Array.isArray(key)) {
          value = key.join('');
        } else if (value === undefined && !Array.isArray(key) && this.set[i]) {
          value = this.set[i].value; // set previous value, doesn't require developer to pass all properties
        } else if (value === undefined && !Array.isArray(key) && !this.set[i]) {
          value = '';
        }
        if (!this.rendered) {
          template = template.replace(/(>)[^>]*$/g,  ` render-mixin-id="${key}">`);
          template += `${value}${string}`;
        }
        if (this.set[key] && this.set[key] !== value) {
          changes[key] = value;
          this.set[key] = value;
        } else if (!this.set[key]) {
          this.set[key] = value;
          changes[key] = value;
        }
      });
    } else {
      template += strings[0];
    }
    return {
      template,
      changes
    };
  }

  renderer(properties = this.properties, template = this.template) {
    if (!properties) properties = {};
    else if (!this.isFlat(properties)) {
      // check if we are dealing with an flat or indexed object
      // create flat object getting the values from super if there is one
      // default to given properties set properties[key].value
      // this implementation is meant to work with 'property-mixin'
      // checkout https://github.com/vandeurenglenn/backed/src/mixin/property-mixin
      // while I did not test, I believe it should be compatible with PolymerElements
      const object = {};
      // try getting value from this.property
      // try getting value from properties.property.value
      // try getting value from property.property
      // fallback to property
      for (const key of Object.keys(properties)) {
        let value;
        if (this[key] !== undefined) value = this[key];
        else if (properties[key].value !== undefined) {
          value = properties[key].value;
        } else {
          value = '';
        }
        object[key] = value;
      }      properties = object;
    }
    render(this, this.beforeRender(template(properties)));
  }

  /**
   * wether or not properties is just an object or indexed object (like {prop: {value: 'value'}})
   */
  isFlat(object) {
    const firstObject = object[Object.keys(object)[0]];
    if (firstObject)
      if (firstObject.hasOwnProperty('value') ||
          firstObject.hasOwnProperty('reflect') ||
          firstObject.hasOwnProperty('observer') ||
          firstObject.hasOwnProperty('render'))
        return false;
    else return true;
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();

    if (this.render) {
      this.render();
      this.rendered = true;
    }  }
};

export { define as a, RenderMixin as b };
