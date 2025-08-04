
import { SpecGradient } from './SpecGradient.js'

export { SpecGradientGray }

class SpecGradientGray extends SpecGradient {

    colorFunction(val) {
        // return `hsl(0, 0%, ${parseInt((val) * 100)}%)`
        return `hsl(0, 0%, ${parseInt(((val * 0.6) * 30000 * this.opa_sc)) % 100}%)`
    }

}
