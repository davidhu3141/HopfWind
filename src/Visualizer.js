
export { Visualizer }

class Visualizer {

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
