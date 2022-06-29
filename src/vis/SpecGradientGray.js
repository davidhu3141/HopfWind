
import { SpecGradient } from './SpecGradient.js'

export { SpecGradientGray }

class SpecGradientGray extends SpecGradient {

    colorFunction(val) {
        return `hsl(0, 100%, ${val * 50}%)`
    }

}
