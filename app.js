const LifxClient = require('./services/LIFX')
const AudioListener = require('./services/AudioListener')

const lifx = new LifxClient()
new AudioListener(lifx)