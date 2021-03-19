import { Bar, Pen, Segment } from './types'
export class DataStore {
    private _m1bars: Bar[]    // 1分钟Bar数组
    private _pens: Pen[]
    private _segments: Segment[]

    constructor() {
        this._m1bars = []
        this._pens = []
        this._segments = []
    }

    to_json() {
        // TODO
        return null
    }

    from_json() {
        // TODO
        return
    }

    public get bars() {
        return this._m1bars
    }

    public get pens() {
        return this._pens
    }

    public get segments() {
        return this._segments
    }

    time2index(time: number): number {
        const timeframe = 1000 * 60
        if (this._m1bars.length === 0) return -1
        const start = this._m1bars[0].time
        const index = (time - start) / timeframe
        if (index >= this._m1bars.length) return -1
        return index
    }
}