import * as THREE from 'three'

import { Visualizer } from '../class/Visualizer.js'

export { HopfWind }

class HopfWind extends Visualizer {

    sampleSize
    object_pool = [];

    magfy = 8

    rot_is = 1 // initial
    rot_sg = 1 // gain

    opa_def = 0.01//0.1 // initial
    opa_gbs = 0.5 // gain
    opa_sc = 1 // scale

    hopf_lat = 0.55
    hopf_lc = 1.57 // cap

    sm_dec = 7 // decay
    sm_fac = 1.5 // gain
    sm_cap = 1 //cap

    magall = 0 // store
    magdec = 10 // decay
    magloud = 0 // gain loud

    useFour = false
    capouterlight = false//true
    atancap = 4//3
    toriparty = false
    tempForToricParty = null

    sphere_rot = 0 // clifford store
    cliff90 = false
    cliffauto = true//false
    objectAngle = 0

    use_user_image = false
    user_image = ""
    current_color = new THREE.Color(1, 1, 1)

    lq_angle = 0

    _circres = 150
    _4drotationspeed = 0
    _3drotationspeed = 0

    overallMagnitude = 8

    constructor(sampleSize) {

        super()
        this.sampleSize = sampleSize

        this.generateFibers();

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        this.scene.add(light)
    }

    generateFibers() {
        // Remove existing fibers from scene
        this.object_pool.forEach(fiber => this.scene.remove(fiber));
        this.object_pool = [];
        for (var j = 0; j < this.sampleSize; j++) {
            var fiberGeo = new THREE.BufferGeometry().setFromPoints(this.arbitraryPath());
            var fiberMaterial = new THREE.LineBasicMaterial({ color: this.current_color, transparent: true, opacity: 1, depthWrite: false });
            var newFiber = new THREE.Line(fiberGeo, fiberMaterial);
            this.scene.add(newFiber);
            this.object_pool.push(newFiber);
        }
    }

    applySettingForWPE(properties) {
        try {
            super.applySettingForWPE(properties)
            /////////////////////////////////////////////////////////
            if (properties.toruscolor) {
                var customColor = properties.toruscolor.value.split(' ')
                this.current_color = new THREE.Color(customColor[0] * 1, customColor[1] * 1, customColor[2] * 1)
                this.object_pool.forEach(e => { e.material.color = this.current_color })
            }
            if (properties.showonlyhalf) {
                this.show_half = !properties.showonlyhalf.value
                this.windowResized()
            }
            if (properties.customimage) {
                this.use_user_image = properties.customimage.value
                if (this.use_user_image && this.user_image)
                    document.body.setAttribute("style", `background-image: url("file:///${this.user_image}")`)
                else
                    document.body.setAttribute("style", '')
            }
            if (properties.customimagepath) {
                this.user_image = properties.customimagepath.value
                if (this.use_user_image)
                    document.body.setAttribute("style", `background-image: url("file:///${this.user_image}")`)
            }
            /////////////////////////////////////////////////////////
            if (properties.rot_is) {
                this.rot_is = properties.rot_is.value
            }
            if (properties.rot_sg) {
                this.rot_sg = properties.rot_sg.value
            }
            /////////////////////////////////////////////////////////
            if (properties.opa_sc) {
                this.opa_sc = properties.opa_sc.value
            }
            if (properties.opacitydefault) {
                this.opa_def = Math.pow(properties.opacitydefault.value, 2)
            }
            if (properties.opa_gbs) {
                this.opa_gbs = properties.opa_gbs.value
            }
            /////////////////////////////////////////////////////////
            if (properties.hopf_lat) {
                this.hopf_lat = properties.hopf_lat.value / 180 * Math.PI
            }
            if (properties.hopflatitudecap) {
                this.hopf_lc = properties.hopflatitudecap.value / 180 * Math.PI
            }
            /////////////////////////////////////////////////////////
            if (properties.sm_fac) {
                this.sm_fac = properties.sm_fac.value
            }
            if (properties.sm_dec) {
                this.sm_dec = properties.sm_dec.value * 10
            }
            if (properties.soundmagnitudecap) {
                this.sm_cap = properties.soundmagnitudecap.value
            }
            /////////////////////////////////////////////////////////
            if (properties.magloud) {
                this.magloud = properties.magloud.value
            }
            if (properties.magfy) {
                this.magfy = properties.magfy.value
            }
            if (properties.view) {
                this.viewAngle = properties.view.value / 180 * Math.PI
                this.windowResized()
            }
            if (properties.capouterlight) {
                this.capouterlight = properties.capouterlight.value
            }
            if (properties.usefour) {
                this.useFour = properties.usefour.value
            }
            if (properties.atancap) {
                this.atancap = properties.atancap.value + 3
            }
            if (properties.cliffordrotation45) {
                this.cliff90 = properties.cliffordrotation45.value
            }
            if (properties._4drotationspeed) {
                this._4drotationspeed = properties._4drotationspeed.value
            }
            if (properties._3drotationspeed) {
                this._3drotationspeed = properties._3drotationspeed.value;
            }
            if (properties.toricgotoparty) {
                this.toriparty = properties.toricgotoparty.value
                if (!this.toriparty) {
                    this.object_pool.forEach(e => { e.material.color = this.current_color })
                }
            }
            if (properties.fiberresolution) {
                this._circres = properties.fiberresolution.value;
                this.generateFibers();
            }
            if (properties.overallmagnitude) {
                this.overallMagnitude = properties.overallmagnitude.value;
            }
            if (properties.cliffordrotationauto) {
                this.cliffauto = properties.cliffordrotationauto.value
            }
        } catch (e) { console.log(e) }
    }

    windowResized(innerWidth, innerHeight) {
        super.windowResized(innerWidth, innerHeight)
    }

    render(time, audioSamples) {

        const circres = this._circres
        audioSamples = audioSamples.map(e => e * this.overallMagnitude)

        var sum = audioSamples.reduce((a, b) => a + b) / 128
        var magall_new = sum * this.magloud / 2
        var t = time / 2

        this.lq_angle += 0.0012 * this.rot_is + sum / 6 * this.rot_sg
        this.magall = magall_new >= this.magall
            ? magall_new
            : (this.magall * this.magdec) / (this.magdec + 1)

        if (this._3drotationspeed > 0) {
            this.objectAngle += this._3drotationspeed
        } else {
            this.objectAngle = 0
        }
        const oc = Math.cos(this.objectAngle)
        const os = Math.sin(this.objectAngle)
        const qc = Math.cos(this.objectAngle / 0.77)
        const qs = Math.sin(this.objectAngle / 0.77)

        if (this.cliff90) { // todo: become number
            this.sphere_rot = Math.PI / 2
        } else if (this.cliffauto) {
            this.sphere_rot += Math.max(this._4drotationspeed, 0.002)
        } else if (this._4drotationspeed > 0) {
            this.sphere_rot += this._4drotationspeed
        } else {
            this.sphere_rot = 0
        }
        // todo: seperate decay, decay called smooth -> only one decay / done
        // size looks like zoom -> already, just tan calib
        const sc = Math.cos(this.sphere_rot)
        const ss = Math.sin(this.sphere_rot)


        for (var j = 0; j < 128; j++) {

            let i = j % 64

            let position_l = this.object_pool[j].geometry.attributes.position
            let material_l = this.object_pool[j].material

            let opa_new = (this.opa_def + this.opa_gbs * audioSamples[j]) * this.opa_sc
            material_l.opacity = opa_new >= material_l.opacity
                ? opa_new
                : (material_l.opacity * this.sm_dec + opa_new) / (this.sm_dec + 1)

            if (this.capouterlight && j < 64) material_l.opacity /= 2

            if (this.toriparty) {
                let hue = (audioSamples[j] * 120 + Math.max(t, this.lq_angle * 18)) % 270 + 120
                material_l.color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
            }

            let lp = -(this.hopf_lat + Math.min(audioSamples[j], this.sm_cap) * this.sm_fac + this.magall)
            let lq

            if (j < 64) { lp = Math.max(-this.hopf_lc, lp) }
            else { lp = Math.min(1.57, lp) }

            if (!this.useFour) {
                lq = i / 64 * 6.28 + this.lq_angle
            } else {
                lq = i / 40 * 6.28 + this.lq_angle
                if (j >= 32 && j < 96) {
                    lq *= -1
                    lp /= 3
                }
            }

            var point_x_tmp = Math.cos(lp) * Math.cos(lq)
            var point_z = Math.cos(lp) * Math.sin(lq) //y
            var point_y_tmp = Math.sin(lp) // z
            var point_x = point_x_tmp * sc - point_y_tmp * ss
            var point_y = point_y_tmp * sc + point_x_tmp * ss

            if (j >= 64) {
                point_x *= -1
                point_y *= -1
                point_z *= -1
            }

            const alpha = Math.sqrt((1 - point_y) / 2)
            const beta = Math.sqrt((1 + point_y) / 2)
            const angleSum = Math.atan2(point_x, -point_z)

            if (this.atancap == 3) {
                for (var k = 0; k <= circres; k++) {
                    const theta = 2 * Math.PI * this.regulate(k / circres)
                    const phi = angleSum - theta
                    const proj = 0.5 / (1 - alpha * Math.sin(theta)) * this.magfy

                    const finalx = -beta * proj * Math.cos(phi)
                    const tmp_finaly = alpha * proj * Math.cos(theta)
                    const tmp_finalz = -beta * proj * Math.sin(phi)
                    const finaly = tmp_finaly * oc - tmp_finalz * os
                    const finalz = tmp_finaly * os + tmp_finalz * oc

                    position_l.setX(k, finalx)
                    position_l.setY(k, finaly)
                    position_l.setZ(k, finalz)
                }
            } else {
                for (var k = 0; k <= circres; k++) {
                    const theta = 2 * Math.PI * this.regulate(k / circres)
                    const phi = angleSum - theta
                    const proj = 0.5 / (1 - alpha * Math.sin(theta)) * this.magfy

                    const tmp_finalx = -beta * proj * Math.cos(phi)
                    const tmp_finaly = alpha * proj * Math.cos(theta)
                    const tmp_finalz = -beta * proj * Math.sin(phi)
                    const finalx = tmp_finalx * qc - tmp_finaly * os * qs - tmp_finalz * oc * qs;
                    const finaly = tmp_finaly * oc - tmp_finalz * os;
                    const finalz = tmp_finalx * qs + tmp_finaly * os * qc + tmp_finalz * oc * qc;

                    const r = Math.hypot(finalx, finaly, finalz)
                    const newr = this.atancap * Math.atan(r / this.atancap) * this.magfy / 4

                    position_l.setX(k, finalx * newr / r)
                    position_l.setY(k, finaly * newr / r)
                    position_l.setZ(k, finalz * newr / r)
                }
            }

            position_l.needsUpdate = true
        }
        this.renderer.render(this.scene, this.camera)
    }

    arbitraryPath() {
        const circres = this._circres
        let path = new THREE.Path()
        path.moveTo(0, 0, 0)
        for (var i = 1; i <= circres; i++) path.lineTo((i % 2) / 100, 0, 0)
        return path.getPoints()
    }

    regulate(v) {
        let prop = 0.67
        return v < prop ? v / prop * 0.5 : (v / (1 - prop) - 1 / (1 - prop)) * 0.5 + 1
    }

}
