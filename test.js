const ClockScript = require('./clock-script.js');
const clock = new ClockScript()
const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const start = { hour: 17, minutes: 0 };
const stop = { hour: 24, minutes: 0 };

const config = days.map(day => { return { day, start, stop } })
const day = new Date().getDay()
clock.subscribe('on', cb => {
  console.log(cb, 'on')
  const date = new Date()
  // config[day].stop = { hour: date.getHours(), minutes: date.getMinutes()}
  // clock.run(config)
})
clock.subscribe('off', cb => {
  console.log(cb, 'off')
  const date = new Date()
  // config[day].start = { hour: 22, minutes: 0}
  // config[day].stop = { hour: 22, minutes: 22}
  // clock.run(config)
})
clock.run(config)
