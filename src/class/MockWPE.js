
export { MockWPE }

class MockWPE {

    static audioSampleRegisterSelector() {

    }

    static uiRegisterSelector() {

    }

    static addGUI() {
        let gui = new dat.GUI();
        let settings = vis.settings;
        let settingKeys = vis.settingKeys;
        settingKeys.forEach(k => {
            gui.add(settings, k);
        })
    }

}