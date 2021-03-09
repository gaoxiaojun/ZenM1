import { Bar, Candle, Fractal, FractalType, Line, Segment } from './types'
import { update_fractal } from './candle'
import { update_line } from './line'
import { update_segment } from './segment'

export class Analyzer {
  private candle_series: Candle[]
  private fractal_series: Fractal[]
  private line_series: Line[]
  private segment_series: Segment[]

  private detected_line: Fractal[]

  constructor() {
    this.candle_series = new Array()
    this.fractal_series = new Array()
    this.line_series = new Array()
    this.segment_series = new Array()
    this.detected_line = new Array()
  }

  update(k: Bar) {
    // 1. update fractal
    const last_fractal = update_fractal(this.candle_series, k)

    if (last_fractal === null) return

    this.fractal_series.push(last_fractal)
    // 3. update line

    update_line(this.detected_line, last_fractal)

    // 4. update segment

    update_segment(this.line_series)
  }

}