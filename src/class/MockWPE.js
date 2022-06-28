
export { MockWPE }

class MockWPE {

    // public
    static audioFile

    // intended to be private
    static audioContext
    static analyser
    static track

    static fftSize = 2048
    static bufferLength = this.fftSize / 2
    static finalBinCount = 128
    static buffer = new Uint8Array(this.bufferLength).fill(0);
    static finalBin = new Array(this.finalBinCount)

    static init() {


    }

    static setAudioFile(audioElement) {

        AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.fftSize;

        this.track = this.audioContext.createMediaElementSource(audioElement);
        this.track.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination)

        audioElement.play()
    }

    static registerAudioListener(listener) {

        setInterval(() => {

            this.analyser.getByteFrequencyData(this.buffer)

            // const k = this.finalBinCount / 2
            // for (let i = 0; i < k; i++) {
            //     const j = i * 8
            //     this.finalBin[i] = (this.buffer[j] + this.buffer[j + 1] + this.buffer[j + 2] + this.buffer[j + 3]
            //         + this.buffer[j + 4] + this.buffer[j + 5] + this.buffer[j + 6] + this.buffer[j + 7]) / 2048
            // }
            // for (let i = k; i < this.finalBinCount; i++) {
            //     this.finalBin[i] = this.finalBin[i - k]
            // }

            // for (let i = 0; i < this.finalBinCount; i++) {
            //     const j = i * 8
            //     this.finalBin[i] = (this.buffer[j] + this.buffer[j + 1] + this.buffer[j + 2] + this.buffer[j + 3]
            //         + this.buffer[j + 4] + this.buffer[j + 5] + this.buffer[j + 6] + this.buffer[j + 7]) / 2048
            // }

            for (let i = 0; i < this.finalBinCount; i++) {
                const j = i * 2
                this.finalBin[i] = (this.buffer[i] + this.buffer[i + 1]) / 256 / 2
            }

            listener(this.finalBin)

        }, 50)
    }

    static setupGUI(settings, settingKeys) {

        let gui = new dat.GUI();
        settingKeys.forEach(e => { gui.add(settings, e); })
    }

}