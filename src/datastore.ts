import {Bar,Pen,Segment} from './types'

export class DataStore {
    private _bars: Bar[]
    private _pens: Pen[]
    private _segments: Segment[]

    constructor() {
        this._bars = []
        this._pens = []
        this._segments = []
    }

    to_json(){

    }

    from_json() {

    }

    public get bars() {
        return this._bars
    }

    public get pens() {
        return this._pens
    }

    public get segments() {
        return this._segments
    }
}