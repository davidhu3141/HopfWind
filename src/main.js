
import { MockWPE } from './class/MockWPE.js'
import { SpecGradient } from './vis/SpecGradient.js'
import { SpecGradientGray } from './vis/SpecGradientGray.js'

// -------------------------------------

var frameLapsed = 0
var isWPE = !!(window.wallpaperRegisterAudioListener)
var sampleSize = isWPE ? 128 : 1024
var audioSamples = Array(sampleSize).fill(0)
// var vis = new SpecGradient(sampleSize)
var vis = new SpecGradientGray(sampleSize)

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
    MockWPE.registerAudioListener(wallpaperAudioListener, sampleSize)
    // MockWPE.setupGUI(vis.settings, vis.settingKeys)
}

window.addEventListener('load', () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
    window.requestAnimationFrame(run)

    document.querySelector("#fileinput")
        .addEventListener("change", fileSelected);
})

window.addEventListener('resize', () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
})

function fileSelected(files) {
    // console.log(this.files[0])
    MockWPE.setAudioFile(new Audio(URL.createObjectURL(this.files[0])))
}
