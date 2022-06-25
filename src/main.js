
import { MockWPE } from './class/MockWPE.js'
import { SpecGradient } from './vis/SpecGradient.js'

// -------------------------------------

var vis = new SpecGradient()
var frameLapsed = 0
var audioSamples = Array(128).fill(0)
const isWPE = !!(window.wallpaperRegisterAudioListener)

// -------------------------------------

function wallpaperAudioListener(audioArray) {
    audioSamples = audioArray
}

function run() {
    window.requestAnimationFrame(run)
    vis.render(frameLapsed++, audioSamples)
}

// -------------------------------------

if (isWPE) {
    window.wallpaperRegisterAudioListener(wallpaperAudioListener)
    window.wallpaperPropertyListener = { applyUserProperties: vis.applySettingForWPE }
} else {
    MockWPE.init()
    MockWPE.registerAudioListener(wallpaperAudioListener)
    // MockWPE.setupGUI(vis.settings, vis.settingKeys)
}

window.addEventListener('load', () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
    window.requestAnimationFrame(run)
})

window.addEventListener('resize', () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
})


