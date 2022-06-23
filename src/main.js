
import { MockWPE } from 'class/MockWPE.js'
import { SpecGradient } from 'vis/SpecGradient.js'

// -------------------------------------

var vis = new SpecGradient()
var frameLapsed = 0
var audioSamples = Array(128).fill(0)

// -------------------------------------

function isWPE() {
    return !(window.wallpaperRegisterAudioListener == undefined);
}

function wallpaperAudioListener(audioArray) {
    audioSamples = audioArray
}

function run() {
    window.requestAnimationFrame(run)
    vis.render(frameLapsed++, audioSamples)
}

// -------------------------------------

let environment = isWPE() ? window : MockWPE
environment.wallpaperRegisterAudioListener(wallpaperAudioListener)
environment.wallpaperPropertyListener = {
    applyUserProperties: vis.applySettingForWPE
}

window.addEventListener('load', () => {
    window.requestAnimationFrame(run)
})

window.addEventListener('resize', () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
})


