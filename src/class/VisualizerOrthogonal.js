import * as THREE from 'three'

export { VisualizerOrthogonal }

class VisualizerOrthogonal {
    // three js settings
    scene = null
    renderer = null
    camera = null

    // camera settings
    viewZ = 60
    pixsz = 1
    canvasPortion = 1.2
    show_half = !true
    offX = 0
    offY = 0
    viewAngle = 0

    use_user_image = false
    user_image = ""
    overallMagnitude = 2

    constructor(sortObjects = false) {
        this.scene = new THREE.Scene()
        const { left, right, top, bottom } = this._computeOrthoFrustum(
            window.innerWidth,
            window.innerHeight)
        this.camera = new THREE.OrthographicCamera(
            left, right, top, bottom,
            1,
            this.show_half ? this.viewZ : this.viewZ * 2
        )
        // ---

        this.renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ alpha: true, antialias: true, sortObjects: sortObjects })
            : this.showError("Error: WebGLRenderer not supported")
        this.renderer.setClearColor(0x000000, 0.0)

        // place the camera once
        this.cameraReposition()
    }

    // ---------------- for overriding
    applySettingForWPE(properties) { console.log("Should override applySettingForWPE") }
    render(time, audioSamples) { console.log("Should override render") }

    windowResized() {
        const innerWidth = window.innerWidth
        const innerHeight = window.innerHeight

        this.renderer.setSize(
            innerWidth / (this.pixsz * this.canvasPortion),
            innerHeight / (this.pixsz * this.canvasPortion)
        )
        document.querySelector("#canvasLoader").appendChild(this.renderer.domElement)
        this.renderer.domElement.setAttribute("style",
            `width:${innerWidth / this.canvasPortion}px;` +
            `height:${innerHeight / this.canvasPortion}px;` +
            `left:${innerWidth * (1 - 1 / this.canvasPortion + this.offX) / 2}px;` +
            `top:${innerHeight * (1 - 1 / this.canvasPortion + this.offY) / 2}px;`
        )

        // --- changed: recompute ortho frustum on resize
        const frustum = this._computeOrthoFrustum(innerWidth, innerHeight)
        this.camera.left = frustum.left
        this.camera.right = frustum.right
        this.camera.top = frustum.top
        this.camera.bottom = frustum.bottom
        this.camera.near = 1
        this.camera.far = this.show_half ? this.viewZ : this.viewZ * 2
        // ---

        this.cameraReposition()
    }

    cameraReposition() {
        this.camera.position.z = this.viewZ * Math.cos(this.viewAngle)
        this.camera.position.y = this.viewZ * Math.sin(this.viewAngle)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.camera.updateProjectionMatrix()
    }

    // --- added: helper to compute orthographic bounds
    _computeOrthoFrustum(innerWidth, innerHeight) {
        const aspect = innerWidth / innerHeight
        const oldFov = 30
        // Choose an orthographic size that roughly preserves your current framing:
        // half-height at distance viewZ with the current effective FOV.
        const effectiveFov = oldFov
        const halfHeight = this.viewZ * Math.tan(THREE.MathUtils.degToRad(effectiveFov / 2))

        const halfWidth = halfHeight * aspect
        return {
            left: -halfWidth,
            right: halfWidth,
            top: halfHeight,
            bottom: -halfHeight,
        }
    }

    showError(message) {
        setTimeout(() => {
            let errorDiv = document.createElement('div')
            errorDiv.style.color = 'white'
            errorDiv.style.zIndex = '9999'
            errorDiv.style.fontSize = '18px'
            document.body.appendChild(errorDiv)
            errorDiv.textContent = message
        }, 1000)
    }
}
