
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


    constructor() {
        this.settings = {}
        this.settingKeys = {}
    }

    applySettingForWPE(properties) { }

    getRenderer() {
        return this.renderer
    }

    getRendererDomElement() {
        return this.getRenderer().domElement;
    }

}
