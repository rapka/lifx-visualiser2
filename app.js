const LifxClient = require('node-lifx').Client
const client = new LifxClient()
const mic = require('mic')
const WavDecoder = require('wav-decoder')
const header = require('waveheader')
const max = require('lodash.max')
const clamp = require('lodash.clamp')
const config = require('./config')

const getLabel = (light, callback) => {
  light.getLabel((err, data) => {
    if (err) return callback("Null")
    return callback(data)
  })
}

client.on('light-new', light => {
  getLabel(light, name => {
    console.log(name + " connected!")
  })
})

client.on('light-online', light => {
  getLabel(light, name => {
    console.log(name + " reconnected")
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
const beatHoldFrames = config.beatHoldFrames || 8

// what amplitude level can trigger a beat?
const beatThreshold = config.beatThreshold || 0.001

// When we have a beat, beatCutoff will be reset to cutoffMultiplier*level, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
let beatCutoff = 0
const cutoffMultiplier = config.cutoffMultiplier || 1.2
const beatDecayRate = config.beatDecayRate || 0.4 // how fast does beat cutoff decay?
let framesSinceLastBeat = 0 // once this equals beatHoldFrames, beatCutoff starts to decay.

// microphone
const micConfig = {
  rate: 44100,
  channels: 2,
  fileType: 'wav'
}

const micInstance = mic(micConfig)
const stream = micInstance.getAudioStream()

stream.on('data', buffer => {
  let headerBuf = header(micConfig.rate, micConfig);
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
    beatCutoff = level * cutoffMultiplier
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

let lastLevel = 0
const onBeat = level => {
  if(!client.lights()) return

  let levelDifference = Math.abs(lastLevel - level)
  levelDifference = clamp(levelDifference, 0, 1)
  lastLevel = level

  client.lights().forEach(light => { 
    getLabel(light, name => {
      const colour = pickNextColour(name, levelDifference, level)
      light.color(colour.h, colour.s, level * 100, colour.k, config.colourTransitionTime || 200)   
    })
  })
}

const pickNextColour = (lightName, brightnessDifference, brightness) => {
  const colours = config.colours

  let possibleColours = []
  colours.forEach(colour => {
    if((colour.useLights && colour.useLights.includes(lightName)) || !colour.useLights) {
      switch(colour.triggeredBy) {
        case "BRIGHTNESS VALUE":
          if(brightness >= colour.brightnessRange.min && brightness <= colour.brightnessRange.max) {
            const weight = colour.weight || 1;
            for(let i = 0; i < weight; i++) ppossibleColours.push(hskToObj(colour.hsk))
          }
          break;
        case "BRIGHTNESS CHANGE":
          if(brightnessDifference >= colour.brightnessRange.min && brightnessDifference <= colour.brightnessRange.max) {
            const weight = colour.weight || 1;
            for(let i = 0; i < weight; i++) possibleColours.push(hskToObj(colour.hsk))
          }
          break;
      }
    }
  })

  if(possibleColours.length === 0) {
    colours.forEach(colour => {
      if(colour.triggeredBy !== "BRIGHTNESS VALUE" && colour.triggeredBy !== "BRIGHTNESS CHANGE") {
        const weight = colour.weight || 1;
        for(let i = 0; i < weight; i++) possibleColours.push(hskToObj(colour.hsk))
      }
    });
  }

  return possibleColours[Math.floor(Math.random()*possibleColours.length)]
}

const hskToObj = hsk => {
  return {
    h: +hsk.split(",")[0],
    s: +hsk.split(",")[1],
    k: +hsk.split(",")[2]
  }
}