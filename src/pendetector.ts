import { Bar, Candle, Fractal, FractalType, Pen, PenType, PenStatus } from './types'
import { DataStore } from './datastore'
import { assert } from './assert';

export interface PenEventCallback {
    OnPenNew(): void;
    OnPenContinue(): void;
    OnPenComplete(): void;
}

export class PenDetector {
    private _candles: Candle[]
    private _fractals: Fractal[]
    private _store: DataStore
    private _cb: PenEventCallback

    constructor(store: DataStore, callback: PenEventCallback) {
        this._candles = []
        this._fractals = []
        this._store = store
        this._cb = callback
    }

    public update(bar: Bar) {
        const len = this._store.bars.push(bar)
        const included = this.remove_include(bar)
        if (included === true) return

        if (this._candles.length < 3) return

        const newFractal = this.check_fractal()

        if (newFractal === null) return

        this.update_pen(newFractal)
    }

    private build_candle_from_bar(bar: Bar) {
        const candle: Candle = {
            time: bar.time,
            high: bar.high,
            low: bar.low,
        }
        return candle
    }

    // 在Candles中，通过最后3个Candle，检测顶底分型
    private check_fractal(): Fractal | null {
        const len = this._candles.length
        assert(len >= 3)
        const K1 = this._candles[len - 3]
        const K2 = this._candles[len - 2]
        const K3 = this._candles[len - 1]

        if ((K1.high < K2.high) && (K2.high > K3.high)) {
            // assert(K1.low <= K2.low && K2.low >= K3.low, "顶分型的底不是最高的")
            return {
                time: K2.time,
                type: FractalType.Top,
                high: K2.high,
                low: K2.low,
                fx: K2.high,
                index: len - 2  // 注意保存的是 Candle Index
            }
        }

        if ((K1.low > K2.low) && (K2.low < K3.low)) {
            // assert((K1.high >= K2.high) && (K2.high <= K3.high), "底分型的顶不是最低的")
            return {
                time: K2.time,
                type: FractalType.Bottom,
                high: K2.high,
                low: K2.low,
                fx: K2.low,
                index: len - 2
            }
        }

        return null
    }

    private is_include(k1: Candle, k2: Bar) {
        const included = (k1.high >= k2.high && k1.low <= k2.low) || (k1.high <= k2.high && k1.low <= k2.low)
        return included
    }

    /**
     * 
     * @param k 最新Bar
     * @returns true 有包含关系或者初始Candle不足，false 无包含关系
     */
    private remove_include(k: Bar) {
        const len = this._candles.length
        // 初始边界条件验证，前两个candle必须是非包含的
        switch (len) {
            case 0: // 队列中没有K线
                this._candles.push(this.build_candle_from_bar(k))
                return true

            case 1: // 仅有一根K线
                // TODO: 这里的逻辑需要仔细考虑下，当前处理有误差
                const included = this.is_include(this._candles[0], k)
                if (included) this._candles.pop() // 存在包含关系，抛弃队列中的Candle
                this._candles.push(this.build_candle_from_bar(k))
                return true

        }

        // 队列中有两个及以上的经过包含处理的K线,处理与当前K3的包含关系
        const k1 = this._candles[len - 2]
        const k2 = this._candles[len - 1]
        const k3 = k

        // TODO: 一字板与前后一根K的高低点相同或者连续一字板的情况没有考虑

        // 检测k2,k3的是否有包含关系
        if (this.is_include(k2, k3)) {
            // k2,k3有包含关系
            if (k1.high + k1.low > k2.high + k2.low) {
                // 下包含，取低低
                k2.high = Math.min(k3.high, k2.high)
                k2.low = Math.min(k3.low, k2.low)
                k2.time = k2.low <= k3.low ? k2.time : k3.time
            } else {
                // 上包含，取高高
                k2.high = Math.max(k3.high, k2.high)
                k2.low = Math.max(k3.low, k2.low)
                k2.time = k2.high >= k3.high ? k2.time : k3.time
            }
            return true
        }

        // 无包含关系
        this._candles.push(this.build_candle_from_bar(k))
        return false
    }

    private check_pen(pens: Pen[], f1: Fractal, f2: Fractal) {
        // 前顶后低 and 前高后低 and 距离足够
        if ((f1.type === FractalType.Top) && (f2.type === FractalType.Bottom) && (f1.fx > f2.fx)) {
            const distance = f2.index - f1.index
            if (distance >= 4) {
                const newPen = {
                    start: f1,
                    end: f2,
                    type: PenType.Down,
                    status: PenStatus.New
                }
                if (pens.length > 0) {
                    const pen = pens[pens.length - 1]
                    pen.status = PenStatus.Complete
                }

                pens.push(newPen)
                return newPen
            }
        }

        // 前底后顶 and 前低后高 and 距离足够
        if ((f1.type === FractalType.Bottom) && (f2.type === FractalType.Top) && (f1.fx < f2.fx)) {
            const distance = f2.index - f1.index
            if (distance >= 4) {
                const newPen = {
                    start: f1,
                    end: f2,
                    type: PenType.Up,
                    status: PenStatus.New
                }
                if (pens.length > 0) {
                    const pen = pens[pens.length - 1]
                    pen.status = PenStatus.Complete
                }
                pens.push(newPen)
                return newPen

            }
        }

        // 前顶后顶 and 前低后高
        if (f1.type === FractalType.Top && f2.type === FractalType.Top && (pens.length > 0) && (f1.fx < f2.fx)) {
            const pen = pens[pens.length - 1]
            pen.status = PenStatus.Continue
            pen.end = f2
            return pen
        }

        // 前底后底 and 前高后低
        if (f1.type === FractalType.Bottom && f2.type === FractalType.Bottom && (pens.length > 0) && (f1.fx > f2.fx)) {
            const pen = pens[pens.length - 1]
            pen.status = PenStatus.Continue
            pen.end = f2
            return pen
        }

        return null
    }

    private update_pen(current: Fractal) {
        assert(this._fractals.length < 2)
        if (this._fractals.length === 0) {
            this._fractals.push(current)
            return null
        }

        const f1 = this._fractals[this._fractals.length - 1]

        const pen = this.check_pen(this._store.pens, f1, current)

        switch (pen?.status) {
            case PenStatus.New:
                this._fractals[0] = pen.start
                this._fractals[1] = current
                return pen

            case PenStatus.Continue:
                this._fractals[1] = current
                break;
        }

        return null
    }
}