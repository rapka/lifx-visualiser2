const LifxClient = require('node-lifx').Client
const clamp = require('lodash.clamp')
const Colours = require('./Colours')
const config = require('../config')

module.exports = class {
  constructor() {
    this.client = new LifxClient()

    this.client.on('light-new', light => {
      this.getLabel(light, name => {
        console.log(name + " connected!")
      })
    })

    this.client.on('light-online', light => {
      getLabel(light, name => {
        console.log(name + " reconnected")
      })
    })

    this.client.on('light-offline', () => {
      console.log("A light disconnected")
    })

    this.client.init()
  }

  getLabel(light, callback) {
    light.getLabel((err, data) => {
      if (err) return callback("Null")
      return callback(data)
    })
  }

  onBeat(level) {
    if (!this.client.lights()) return

    let levelDifference = Math.abs(this.lastLevel - level)
    levelDifference = clamp(levelDifference, 0, 1)
    this.lastLevel = level

    this.client.lights().forEach(light => {
      this.getLabel(light, name => {
        const colour = Colours.pickNextColour(name, levelDifference, level)
        light.color(colour.h, colour.s, level * 100, colour.k, config.colourTransitionTime || 100)
      })
    })
  }
}