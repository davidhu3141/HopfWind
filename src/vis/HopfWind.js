
import * as THREE from 'three'

import { Visualizer } from '../class/Visualizer.js'

export { HopfWind }

class HopfWind extends Visualizer {

    sampleSize
    object_pool = []

    current_color = new THREE.Color(0.9, 0.9, 0.9)
    lq_angle = 0

    constructor(sampleSize) {

        super()
        this.sampleSize = sampleSize

        for (var j = 0; j < sampleSize; j++) {
            var fiberGeo = new THREE.BufferGeometry().setFromPoints(this.arbitraryPath());
            var fiberMaterial = new THREE.LineBasicMaterial({ color: this.current_color, transparent: true, opacity: 1, depthWrite: false });
            var newFiber = new THREE.Line(fiberGeo, fiberMaterial);
            this.scene.add(newFiber);
            this.object_pool.push(newFiber);
        }

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        this.scene.add(light)
    }

    applySettingForWPE(properties) {

    }

    windowResized(innerWidth, innerHeight) {
        super.windowResized(innerWidth, innerHeight)
    }

    render(time, audioSamples) {

        const n64 = this.sampleSize / 2

        const rot_is = 1
        const rot_sg = 1
        const opa_def = 0.3
        const opa_sc = 1
        const opa_gbs = 1.5
        const hopf_lat = 0.2
        const hopf_lc = 1.5
        const sm_dec = 7
        const sm_fac = 1
        const sm_cap = 0.3
        const magloud = 1
        const magfy = 6
        const sum = audioSamples.reduce((a, b) => a + b) / this.sampleSize
        const magall = sum * magloud / 2
        const capouterlight = true

        const object_pool = this.object_pool
        const lq_angle = this.lq_angle += 0.0012 * rot_is + sum / 6 * rot_sg

        for (var j = 0; j < this.sampleSize; j++) {

            var i = j % n64

            var position_l = object_pool[j].geometry.attributes.position
            var material_l = object_pool[j].material
            var opa_new = (opa_def + opa_gbs * audioSamples[j]) * opa_sc

            material_l.opacity = opa_new >= material_l.opacity
                ? opa_new : (material_l.opacity * sm_dec + opa_new) / (sm_dec + 1)

            if (capouterlight && j < n64)
                material_l.opacity /= 2

            var lp = -(hopf_lat + Math.min(audioSamples[j], sm_cap) * sm_fac + magall)

            if (j < n64)
                lp = Math.max(-hopf_lc, lp)

            var lq = i / n64 * 6.28 + lq_angle

            var point_x_tmp = Math.cos(lp) * Math.cos(lq)
            var point_z = Math.cos(lp) * Math.sin(lq) //y
            var point_y_tmp = Math.sin(lp) // z
            var point_x = point_x_tmp
            var point_y = point_y_tmp

            if (j >= n64) {
                point_x *= -1
                point_y *= -1
                point_z *= -1
            }

            const alpha = Math.sqrt((1 - point_y) / 2)
            const beta = Math.sqrt((1 + point_y) / 2)
            const angleSum = Math.atan2(point_x, -point_z)

            for (var k = 0; k <= n64; k++) {
                const theta = 2 * Math.PI * k / n64
                const phi = angleSum - theta
                const proj = 0.5 / (1 - alpha * Math.sin(theta)) * magfy
                position_l.setX(k, -beta * proj * Math.cos(phi))
                position_l.setY(k, alpha * proj * Math.cos(theta))
                position_l.setZ(k, -beta * proj * Math.sin(phi))
            }

            position_l.needsUpdate = true
        }

        this.renderer.render(this.scene, this.camera)
    }

    arbitraryPath() {
        const n64 = this.sampleSize / 2
        var path = new THREE.Path()
        path.moveTo(0, 0, 0)
        for (var i = 1; i <= n64; i++) path.lineTo((i % 2) / 100, 0, 0)
        return path.getPoints()
    }

}
