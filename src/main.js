
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
    vis.render(frameLapsed++, audioSamples)
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

// originally in load event. so it would cause bugs. try the case that the code is missing
vis.windowResized()
window.requestAnimationFrame(run)
document.body.setAttribute("style", `background-image: url("dist/bg.png")`)
// document.querySelector("#fileinput").addEventListener("change", fileSelected);

window.addEventListener('resize', () => {
    vis.windowResized()
})

// function fileSelected(files) {
//     MockWPE.setAudioFile(new Audio(URL.createObjectURL(this.files[0])))
// }
