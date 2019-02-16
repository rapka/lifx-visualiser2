# LIFX Visualiser 2

A basic, no-nonsense visualiser for your LIFX bulbs using raw microphone input.

## Prerequisites
[Node.js](https://nodejs.org/en/)

Mac/Windows: [SoX](http://sox.sourceforge.net) (can be installed with [brew](https://brew.sh) using ```brew install sox``` on Mac) 

Linux: ALSA tools (e.g. ```sudo apt-get install alsa-base alsa-utils```)

Nodemon (once you have Node & NPM: ```npm install -g nodemon```)

## Setup
Once you've got all the prerequisites, open up a terminal and point it to the folder you've cloned/downloaded the project into.

Run ```npm start```. Your OS might ask for if you want to allow the terminal to use your microphone. Your smart lights should show up as connected and microphone audio should make them change colour.

## Todo list
- Use a sound proxy to get audio data straight from the sound card rather than the microphone.
- Define set of colours to use
- Define set of lights to use
- More granular control like the original visualiser I made


## Credits
[Beat detection algorithm](https://therewasaguy.github.io/p5-music-viz/)