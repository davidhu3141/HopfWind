
export { MockWPE }

class MockWPE {

    // public
    static audioFile

    // intended to be private
    static audioContext
    static analyser
    static audioElement
    static track
    static bufferLength
    static dataArray

    static init() {

        AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
    }

    static setAudioFile() {
        audioElement = document.querySelector('audio');
        track = audioContext.createMediaElementSource(audioElement);
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        track.connect(analyser);
        analyser.connect(audioContext.destination)

        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
    }

    static registerAudioListener(listener) {
        setInterval(() => {
            listener(analyser.getByteTimeDomainData(dataArray))
        }, 50)
    }

    static setupGUI() {
        let gui = new dat.GUI();
        let settings = vis.settings;
        let settingKeys = vis.settingKeys;
        settingKeys.forEach(k => {
            gui.add(settings, k);
        })
    }

}