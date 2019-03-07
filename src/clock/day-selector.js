import define from './../../node_modules/backed/src/utils/define.js';
import RenderMixin from './../../node_modules/custom-renderer-mixin/src/render-mixin.js';
import SelectorMixin from './../../node_modules/custom-select-mixins/src/selector-mixin.js';

export default define(class DaySelector extends RenderMixin(SelectorMixin(HTMLElement)) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'})
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
})
