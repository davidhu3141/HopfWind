
// import { MockWPE } from './class/MockWPE.js'
// import { SpecGradient } from './vis/SpecGradient.js'
// import { SpecGradientGray } from './vis/SpecGradientGray.js'
import { SpecEntity } from './vis/SpecEntity.js'
// import { HopfWind } from './vis/HopfWind.js'
// import { WindTorus } from './vis/WindTorus.js'

// -------------------------------------

let frameLapsed = 0
let isWPE = !!(window.wallpaperRegisterAudioListener)
let sampleSize = isWPE ? 128 : 512
let audioSamples = Array(sampleSize).fill(0)
// let vis = new SpecGradient(sampleSize)
// let vis = new SpecGradientGray(sampleSize)
// let vis = new HopfWind(sampleSize)
let vis = new SpecEntity(sampleSize)
// let vis = new WindTorus(sampleSize)


// -------------------------------------

function wallpaperAudioListener(audioArray) {
    audioSamples = audioArray
}

function run() {
    window.requestAnimationFrame(run)
    try {
        vis.render(frameLapsed++, audioSamples)
    } catch (e) {
        if (frameLapsed % 50 == 0) {
            console.log(e)
        }
    }
}

// -------------------------------------

window.wallpaperRegisterAudioListener(wallpaperAudioListener)
window.wallpaperPropertyListener = {
    applyUserProperties: p => {
        try {
            vis.applySettingForWPE(p);
        } catch (e) { console.log(e) }
    }
}

vis.windowResized()
window.requestAnimationFrame(run)

window.addEventListener('resize', () => {
    vis.windowResized()
})

