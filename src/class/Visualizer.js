
import * as THREE from 'three'

export { Visualizer }

class Visualizer {

    // three js settings
    scene = null
    renderer = null
    camera = null

    // camera settings
    viewZ = 30
    magfy = 6
    pixsz = 1
    canvasPortion = 1.2
    show_half = false
    offX = 0
    offY = 0
    viewAngle = 0

    // desktop 
    use_user_image = false
    user_image = ""

    // settings
    settings = {}
    settingKeys = {}

    constructor() {

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(60,
            window.innerWidth / window.innerHeight, 1,
            this.show_half ? this.viewZ : this.viewZ * 2)
        this.renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ alpha: true })
            : new THREE.CanvasRenderer()

    }

    // ---------------- for overriding

    applySettingForWPE(properties) {
        console.log("Should override applySettingForWPE")
    }

    render(time, audioSamples) {
        console.log("Should override render")
    }

    windowResized(innerWidth, innerHeight) {

        this.renderer.setSize(
            innerWidth / (this.pixsz * this.canvasPortion),
            innerHeight / (this.pixsz * this.canvasPortion))
        document.querySelector("#canvasLoader").appendChild(this.renderer.domElement)
        this.renderer.domElement.setAttribute("style",
            `width:${innerWidth / this.canvasPortion}px;` +
            `height:${innerHeight / this.canvasPortion}px;` +
            `left:${innerWidth * (1 - 1 / this.canvasPortion + this.offX) / 2}px;` +
            `top:${innerHeight * (1 - 1 / this.canvasPortion + this.offY) / 2}px;`
        )
        this.camera.aspect = innerWidth / innerHeight
        this.camera.position.z = this.viewZ * Math.cos(this.viewAngle)
        this.camera.position.y = this.viewZ * Math.sin(this.viewAngle)
        this.camera.far = this.show_half ? this.viewZ : this.viewZ * 2
        this.camera.fov = 60 / this.canvasPortion
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix()
    }

}
