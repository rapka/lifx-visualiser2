const mic = require('mic')
const WavDecoder = require('wav-decoder')
const header = require('waveheader')
const max = require('lodash.max')
const config = require('../config')

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
const cutoffMultiplier = config.cutoffMultiplier || 1.2
const beatDecayRate = config.beatDecayRate || 0.4 // how fast does beat cutoff decay?

module.exports = class {
  constructor(lifxClient) {
    this.lastLevel = 0
    this.lifxClient = lifxClient

    this.beatCutoff = 0
    this.framesSinceLastBeat = 0 // once this equals beatHoldFrames, beatCutoff starts to decay.

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
          this.detectBeat(maxAmplitude)
        })
        .catch(console.log)
    })
    micInstance.start()
  }

  detectBeat(level) {
    if (level > this.beatCutoff && level > beatThreshold) {
      this.lifxClient.onBeat(level)
      this.beatCutoff = level * cutoffMultiplier
      this.framesSinceLastBeat = 0
    } else {
      if (this.framesSinceLastBeat <= beatHoldFrames) {
        this.framesSinceLastBeat++
      } else {
        this.beatCutoff *= beatDecayRate
        this.beatCutoff = Math.max(this.beatCutoff, beatThreshold)
      }
    }
  }
}

