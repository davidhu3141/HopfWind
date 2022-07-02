
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
    // static buffer = new Uint8Array(this.bufferLength).fill(0)
    static buffer = new Float32Array(this.bufferLength).fill(0)

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

            this.analyser.getFloatFrequencyData(this.buffer)

            const step = 1//this.bufferLength / this.finalBinCount * 2
            for (let i = 0; i < this.finalBinCount; i++) {

                if (i >= this.finalBinCount / 2) {
                    this.finalBin[i] = this.finalBin[this.finalBinCount - i - 1]
                    continue
                }

                const j = i * step
                this.finalBin[i] = 0
                for (let k = 0; k < step; k++) {
                    this.finalBin[i] += this.buffer[j + k + 84]
                }
                // this.finalBin[i] = Math.atan((this.finalBin[i] / step + 70) / 20) / Math.PI + 0.5
                this.finalBin[i] = Math.atan((this.finalBin[i] / step + 50) / 20) / Math.PI + 0.5

                const w = 50
                // if (i < w) this.finalBin[i] *= i / w
                if (i < w) this.finalBin[i] = Math.pow(this.finalBin[i], (3 - i / (w - 1) * 2))
                // this.finalBin[i] = Math.abs(this.finalBin[i] % 200) / 200
                // this.finalBin[i] = Math.pow(3, 70 + this.finalBin[i] / step)
                // this.finalBin[i] = Math.abs(this.finalBin[i] / step / 256)
                // this.finalBin[i] = Math.pow(this.finalBin[i], 1.2)
            }

            console.log(this.finalBin)

            for (let i = 0; i < this.finalBinCount; i++) {
                this.finalBin[i] = Math.abs(this.finalBin[i])
            }

            this.audioListener(this.finalBin)

        }, 50)

        audioElement.play()
    }

    static setupGUI(settings, settingKeys) {

        let gui = new dat.GUI();
        settingKeys.forEach(e => { gui.add(settings, e); })
    }

}