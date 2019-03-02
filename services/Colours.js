const config = require('../config')

exports.pickNextColour = (lightName, brightnessDifference, brightness) => {
  const colours = config.colours

  let possibleColours = []
  colours.forEach(colour => {
    if((colour.useLights && colour.useLights.includes(lightName)) || !colour.useLights) {
      switch(colour.triggeredBy) {
        case "BRIGHTNESS VALUE":
          if(brightness >= colour.triggerRange.min && brightness <= colour.triggerRange.max) {
            const weight = colour.weight || 1;
            for(let i = 0; i < weight; i++) possibleColours.push(hskToObj(colour.hsk))
          }
          break;
        case "BRIGHTNESS CHANGE":
          if(brightnessDifference >= colour.triggerRange.min && brightnessDifference <= colour.triggerRange.max) {
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