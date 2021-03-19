import { Bar } from './types'

export class M1BarStore {
    private _bars: Bar[]
    private _timeframe: number;
    constructor() {
        this._bars = [];
        this._timeframe = 1000
    }

    public get timeframe() {
        return this._timeframe
    }

    public set timeframe(tf: number) {
        this._timeframe = tf
    }

    clear() {
        this._bars.length = 0
    }

    push(bar: Bar) {
        return this._bars.push(bar)
    }

    getByTime(time: number) {
        const index = this.time2index(time)
        if (index >= 0) return this._bars[index]
        return null
    }

    time2index(time: number): number {
        if (this._bars.length === 0) return -1
        const start = this._bars[0].time
        const index = (time - start) / this._timeframe
        if (index >= this._bars.length) return -1
        return index
    }

    getByIndex(index: number) {
        if (index >= this._bars.length || index < 0) return null
        return this._bars[index]
    }
}