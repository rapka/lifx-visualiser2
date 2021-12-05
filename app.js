const LifxClient = require('node-lifx').Client
const client = new LifxClient()
const mic = require('mic')
const WavDecoder = require("wav-decoder")
const header = require("waveheader")
const max = require("lodash.max")
const clamp = require("lodash.clamp")

const getLabel = (light, callback) => {
  light.getLabel((err, data) => {
    if (err) return callback("Null")
    return callback(data)
  })
}

client.on('light-new', light => {
  getLabel(light, name => {
    console.log(`light "${name}" connected`)
  })
})

client.on('light-online', light => {
  getLabel(light, name => {
    console.log(`light "${name}" reconnected`)
  })
})

client.on('light-offline', () => {
  console.log("A light disconnected")
})

client.init()

// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
const beatHoldFrames = 7

// what amplitude level can trigger a beat?
const beatThreshold = 0.001

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
let beatCutoff = 0
let beatDecayRate = 0.6 // how fast does beat cutoff decay?
let framesSinceLastBeat = 0 // once this equals beatHoldFrames, beatCutoff starts to decay.

// microphone
const config = {
  rate: 44100,
  channels: 2,
  fileType: 'wav'
}

const micInstance = mic(config)
const stream = micInstance.getAudioStream()

stream.on('data', buffer => {
  let headerBuf = header(config.rate, config);
  WavDecoder.decode(Buffer.concat([headerBuf, buffer]))
  .then(audioData => {
    let wave = audioData.channelData[0]
    const maxAmplitude = max(wave);
    detectBeat(maxAmplitude)
  })
  .catch(console.log)
})
micInstance.start()

const detectBeat = level => {
  if (level > beatCutoff && level > beatThreshold) {
    onBeat(level)
    beatCutoff = level * 1.2
    framesSinceLastBeat = 0
  } else {
    if (framesSinceLastBeat <= beatHoldFrames) {
      framesSinceLastBeat++
    } else {
      beatCutoff *= beatDecayRate
      beatCutoff = Math.max(beatCutoff, beatThreshold)
    }
  }
}

let curColour = 0
const onBeat = level => {
  if(!client.lights()) return

  level = clamp(level, 0, 1)
  if(level === 1 || true) curColour += 5

  client.lights().forEach(light => {
    light.color(curColour%360, 100, level * 100, 9000, 100);        
  })
}