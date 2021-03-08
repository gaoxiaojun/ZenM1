import {Bar,Candle, Fractal, FractalType, Line, Segment} from './types'
import {update_fractal} from './candle'
import {update_line} from './line'
import {update_segment} from './segment'

export class Parser {
  private candle_series: Candle[]
  private fractal_series: Fractal[]
  private line_series: Line[]
  private segment_series: Segment[]

  constructor() {
    this.candle_series = new Array()
    this.fractal_series = new Array()
    this.line_series = new Array()
    this.segment_series = new Array()
  }

  update(k: Bar) {
      // 1. update fractal
      update_fractal(this.candle_series, k)

      // 3. update line

      // 4. update segment
  }

}