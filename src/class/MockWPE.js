
export { MockWPE }

class MockWPE {

    // public
    static audioFile
    static audioListener

    // intended to be private
    static audioContext
    static analyser
    static gainNode
    static track

    static bufferLength = 1024
    static buffer = new Uint8Array(this.bufferLength).fill(0)

    static finalBinCount = 128
    static finalBin;

    static init() {


    }

    static registerAudioListener(listener, finalBinCount) {
        this.audioListener = listener
        this.finalBinCount = finalBinCount
        this.finalBin = new Array(this.finalBinCount).fill(0);
    }

    static setAudioFile(audioElement) {

        AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.15;

        this.track = this.audioContext.createMediaElementSource(audioElement);
        this.track.connect(this.gainNode)
        this.gainNode.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)

        setInterval(() => {

            this.analyser.getByteFrequencyData(this.buffer)

            const step = this.bufferLength / this.finalBinCount
            for (let i = 0; i < this.finalBinCount; i++) {
                // const j = i * step
                // this.finalBin[i] = 0
                // for (let k = 0; k < step; k++) {
                //     this.finalBin[i] += this.buffer[j + k]
                // }
                // this.finalBin[i] = this.finalBin[i] / step / 256
                this.finalBin[i] = this.buffer[i] / 256
            }

            console.log(this.finalBin[80])

            this.audioListener(this.finalBin)

        }, 50)

        audioElement.play()
    }

    static setupGUI(settings, settingKeys) {

        let gui = new dat.GUI();
        settingKeys.forEach(e => { gui.add(settings, e); })
    }

}