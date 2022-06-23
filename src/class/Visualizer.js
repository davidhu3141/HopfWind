
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
    canvasPortion = 1
    show_half = false

    // desktop 
    use_user_image = false
    user_image = ""

    // settings
    settings = {}
    settingKeys = {}

    constructor() {
    }

    // ---------------- for overriding

    applySettingForWPE(properties) {
        console.log("Should override " + applySettingForWPE)
    }

    render() {
        console.log("Should override " + applySettingForWPE)
    }

    windowResized() { }

    // ---------------- no need to override

    getRenderer() {
        return this.renderer
    }

    getRendererDomElement() {
        return this.getRenderer().domElement;
    }

}
