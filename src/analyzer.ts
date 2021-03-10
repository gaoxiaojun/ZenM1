import { Bar, Candle, Fractal, Pen, Segment } from './types'
import { update_fractal } from './candle'
import { update_pen } from './pen'
import { update_segment } from './segment'

export class Analyzer {
  private candle_series: Candle[]
  private fractal_series: Fractal[]
  private pen_series: Pen[]
  private segment_series: Segment[]

  private detected_line: Fractal[]

  constructor() {
    this.candle_series = new Array()
    this.fractal_series = new Array()
    this.pen_series = new Array()
    this.segment_series = new Array()
    this.detected_line = new Array()
  }

  update(k: Bar) {
    // 1. update fractal
    const last_fractal = update_fractal(this.candle_series, k)

    if (last_fractal === null) return

    this.fractal_series.push(last_fractal)


    // 3. update pen

    const pen = update_pen(this.pen_series, this.detected_line, last_fractal)

    if (pen === null)  return

    // 4. update segment

    update_segment(this.segment_series, pen)
  }

}