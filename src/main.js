
import { SpecGradient } from 'vis/HopfWind.js'

var audioSamples = Array(128)
audioSamples.fill(0)

var vis = new HopfWind(window)

function isWPE() {
    return !(window.wallpaperRegisterAudioListener == undefined);
}

// Setting UI, for WPE
window.wallpaperPropertyListener = {
    applyUserProperties: vis.applySettingForWPE
}

function wallpaperAudioListener(audioArray) {
    audioSamples = audioArray.map(e => Math.pow(e, 0.8))
}

function run() {
    vis.render()
}

window.onload = function () {

    if (!isWPE()) {
        let gui = new dat.GUI();
        let settings = vis.settings;
        let settingKeys = vis.settingKeys;
        settingKeys.forEach(k => {
            gui.add(settings, k);
        })
    }

    window.requestAnimationFrame(run)
}

window.onresize = () => {
    vis.windowResized(window.innerWidth, window.innerHeight)
}


