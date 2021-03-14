import { Bar, Candle, Fractal, FractalType, Pen, PenType, PenStatus } from './types'
import { DataStore } from './datastore'
import { assert } from './assert';

export interface PenEventCallback {
    OnPenNew(): void;
    OnPenContinue(): void;
    OnPenComplete(): void;
}

export class PenDetector {
    private _candleId: number
    private _candles: Candle[]
    private _fractals: Fractal[]
    private _store: DataStore
    private _cb: PenEventCallback

    constructor(store: DataStore, callback: PenEventCallback) {
        this._candleId = 1
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

    // ============================================ 以下为包含关系处理(所有特殊情况都已经考虑)======================================
    private build_candle_from_bar(bar: Bar) {
        const candle: Candle = {
            id: this._candleId,
            time: bar.time,
            high: bar.high,
            low: bar.low,
        }

        // 这里是为了今后方便判断分型之间的距离是否满足严格笔的要求, b.id - a.id >= 5，其中a,b为分型的中间K,a在前b在后
        // 因此此Id严格递增，每个新Candle就+1
        this._candleId = this._candleId + 1
        return candle
    }

    /**
     * 去除两根K线的包含关系
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
                // 起始开始的两K就存在包含关系，合理的处理方式是：
                // 1. 如果第一根K包含第二根K，直接忽略与第一根K存在包含的K线，直到遇到不包含的
                // 2. 如果第一根K包含在第二根K，忽略第一根K，从第二根K开始
                const K1_INCLUDE_K2 = this._candles[0].high >= k.high && this._candles[0].low <= k.low
                const K2_INCLUDE_K1 = this._candles[0].high <= k.high && this._candles[0].low <= k.low

                if (K2_INCLUDE_K1) this._candles.pop() // 忽略K1
                if (K1_INCLUDE_K2) return true  // 忽略K2

                this._candles.push(this.build_candle_from_bar(k))
                return true

        }

        // 队列中有两个及以上的经过包含处理的K线,处理与当前K3的包含关系
        const k1 = this._candles[len - 2]
        const k2 = this._candles[len - 1]
        const k3 = k

        // 检测k2,k3的是否有包含关系
        if ((k2.high >= k3.high && k2.low <= k3.low) || (k2.high <= k3.high && k2.low <= k3.low)) {
            assert(k1.high !== k2.high)
            // 特殊的一字板与前一根K高低点相同情况的处理
            const HIGH_EQ_LOW = k3.high === k3.low  // 一字板
            // k2,k3有包含关系
            if (k1.high > k2.high) {
                // 下包含，取低低
                if (HIGH_EQ_LOW && k3.low === k2.low) return true
                k2.high = Math.min(k3.high, k2.high)
                k2.low = Math.min(k3.low, k2.low)
                k2.time = k2.low <= k3.low ? k2.time : k3.time
            } else {
                // 上包含，取高高
                if (HIGH_EQ_LOW && k3.high === k2.high) return true
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


    // ===================================================================== 分型处理 ====================================================
    // 在Candles中，通过最后3个Candle，检测顶底分型
    private check_fractal(): Fractal | null {
        const len = this._candles.length
        assert(len >= 3)
        const K1 = this._candles[len - 3]
        const K2 = this._candles[len - 2]
        const K3 = this._candles[len - 1]

        assert(K1.high !== K2.high)
        assert(K2.high !== K3.high)
        assert(K1.low !== K2.low)
        assert(K2.low !== K3.low)

        if ((K1.high < K2.high) && (K2.high > K3.high)) {
            assert(K1.low <= K2.low && K2.low >= K3.low, "顶分型的底不是最高的")
            return {
                time: K2.time,
                type: FractalType.Top,
                high: K2.high,
                low: K2.low,
                fx: K2.high,
                index: K2.id  // 注意保存的是 Candle Index
            }
        }

        if ((K1.low > K2.low) && (K2.low < K3.low)) {
            assert((K1.high >= K2.high) && (K2.high <= K3.high), "底分型的顶不是最低的")
            return {
                time: K2.time,
                type: FractalType.Bottom,
                high: K2.high,
                low: K2.low,
                fx: K2.low,
                index: K2.id
            }
        }

        return null
    }

    // ================================================================ 笔检测 ===========================================================

    private check_pen(pens: Pen[], f1: Fractal, f2: Fractal) {
        // 前顶后低 and 前高后低 and 距离足够
        if ((f1.type === FractalType.Top) && (f2.type === FractalType.Bottom) && (f1.high > f2.high)) {
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

    // 确保相邻两个顶底之间不存在包含关系

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