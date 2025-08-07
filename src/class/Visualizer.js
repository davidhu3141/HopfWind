import * as THREE from 'three'

export { Visualizer }

class Visualizer {

    // three js settings
    scene = null
    renderer = null
    camera = null

    // camera settings
    viewZ = 30
    pixsz = 1
    canvasPortion = 1.2
    show_half = true
    offX = 0
    offY = 0
    viewAngle = 0//.3

    // desktop 
    use_user_image = false
    user_image = ""

    constructor(sortObjects = false) {

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(60,
            window.innerWidth / window.innerHeight, 1,
            this.show_half ? this.viewZ : this.viewZ * 2)
        this.renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ alpha: true, antialias: true, sortObjects: sortObjects })
            : this.showError("Error: WebGLRenderer not supported")
        this.renderer.setClearColor(0x000000, 0.0);
    }

    // ---------------- for overriding

    applySettingForWPE(properties) {
        if (properties.schemecolor) {
            var schemeColor = properties.schemecolor.value.split(' ')
            schemeColor = schemeColor.map(c => Math.ceil(c * 255))
            properties.schemeColor = schemeColor
        }
        if (properties.offsetx) {
            this.offX = properties.offsetx.value
            this.windowResized()
        }
        if (properties.offsety) {
            this.offY = properties.offsety.value
            this.windowResized()
        }
        if (properties.pixelated) {
            this.pixsz = properties.pixelated.value
            this.windowResized()
        }
        if (properties.canvasportion) {
            this.canvasPortion = properties.canvasportion.value
            this.windowResized()
        }
    }

    render(time, audioSamples) {
        console.log("Should override render")
    }

    windowResized() {

        this.renderer.setSize(
            window.innerWidth / (this.pixsz * this.canvasPortion),
            window.innerHeight / (this.pixsz * this.canvasPortion))
        document.querySelector("#canvasLoader").appendChild(this.renderer.domElement)
        this.renderer.domElement.setAttribute("style",
            `width:${innerWidth / this.canvasPortion}px;` +
            `height:${innerHeight / this.canvasPortion}px;` +
            `left:${innerWidth * (1 - 1 / this.canvasPortion + this.offX) / 2}px;` +
            `top:${innerHeight * (1 - 1 / this.canvasPortion + this.offY) / 2}px;`
        )
        this.camera.aspect = innerWidth / innerHeight
        this.camera.fov = 60 / this.canvasPortion
        this.camera.far = this.show_half ? this.viewZ : this.viewZ * 2
        this.cameraReposition()
    }

    cameraReposition() {
        this.camera.position.z = this.viewZ * Math.cos(this.viewAngle)
        this.camera.position.y = this.viewZ * Math.sin(this.viewAngle)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix()
    }


    showError(message) {
        setTimeout(() => {
            let errorDiv = document.createElement('div');
            errorDiv.style.color = 'white';
            errorDiv.style.zIndex = '9999';
            errorDiv.style.fontSize = '18px';
            document.body.appendChild(errorDiv);
            errorDiv.textContent = message;
        }, 1000);
    }
}
