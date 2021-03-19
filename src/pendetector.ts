import { Bar, Pen, PenStatus, Direction } from './types'
import { DataStore } from './datastore'
import { assert } from './util';


// 经过包含处理的K线
export interface Candle {
    id: number,
    time: number,
    high: number,
    low: number,
    barIndex: number   // 极值点对应的Bar在Bars数组的下标
}

// 分型
export enum FractalType {
    Top,
    Bottom
}

export interface Fractal {
    time: number,
    type: FractalType,
    high: number,
    low: number,
    fxHigh: number,
    fxLow: number,
    highs: number[],
    lows: number[],
    candleIndex: number,// 分型中心candle在Candles数组中的索引
    barIndex: number  // 分型中心极值点在Bars数组中的索引
}
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
        const included = this.remove_include(bar, len - 1)
        if (included === true) return

        if (this._candles.length < 3) return

        const newFractal = this.check_fractal()

        if (newFractal === null) return

        this.update_pen(newFractal)
    }

    // ============================================ 以下为包含关系处理(所有特殊情况都已经考虑)======================================
    private build_candle_from_bar(bar: Bar, index: number) {
        const candle: Candle = {
            id: this._candleId,
            time: bar.time,
            high: bar.high,
            low: bar.low,
            barIndex: index
        }

        // 这里是为了今后方便判断分型之间的距离是否满足严格笔的要求, b.id - a.id >= 4，其中a,b为分型的中间K,a在前b在后
        // 因此此Id严格递增，每个新Candle就+1
        this._candleId = this._candleId + 1
        return candle
    }

    /**
     * 去除两根K线的包含关系
     * @param k 最新Bar
     * @param index 最新Bar在Bars数组中的下标
     * @returns true 有包含关系或者初始Candle不足，false 无包含关系
     */
    private remove_include(k: Bar, index: number) {
        const len = this._candles.length
        // 初始边界条件验证，前两个candle必须是非包含的
        switch (len) {
            case 0: // 队列中没有K线
                this._candles.push(this.build_candle_from_bar(k, index))
                return true

            case 1: // 仅有一根K线
                // 起始开始的两K就存在包含关系，合理的处理方式是：
                // 1. 如果第一根K包含第二根K，直接忽略与第一根K存在包含的K线，直到遇到不包含的
                // 2. 如果第一根K包含在第二根K，忽略第一根K，从第二根K开始
                const K1_INCLUDE_K2 = this._candles[0].high >= k.high && this._candles[0].low <= k.low
                const K2_INCLUDE_K1 = this._candles[0].high <= k.high && this._candles[0].low <= k.low

                if (K2_INCLUDE_K1) this._candles.pop() // 忽略K1
                if (K1_INCLUDE_K2) return true  // 忽略K2

                this._candles.push(this.build_candle_from_bar(k, index))
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
                k2.barIndex = k2.low <= k3.low ? k2.barIndex : index
            } else {
                // 上包含，取高高
                if (HIGH_EQ_LOW && k3.high === k2.high) return true
                k2.high = Math.max(k3.high, k2.high)
                k2.low = Math.max(k3.low, k2.low)
                k2.time = k2.high >= k3.high ? k2.time : k3.time
                k2.barIndex = k2.high >= k3.high ? k2.barIndex : index
            }
            return true
        }

        // 无包含关系
        this._candles.push(this.build_candle_from_bar(k, index))
        return false
    }


    // ===================================================================== 分型处理 ====================================================
    // 不合理的顶底分型：
    // 1. 分型之间不能共用K
    // 2. 顶底分型之间相互包含（前包含肯定不行，后包含有争议，这里前后包含都不允许)

    // 在笔检测的时候，需要通过分型的高低点区间[fxHigh, fxLow]去判断前后分型是否存在包含关系
    // 调用这个函数要确保K3已经完成
    private fractal_3k(K1: Candle, K2: Candle, K3: Candle): Fractal | null {
        // 注意fxHigh, fxLow，这里采用了最严格的标准，用于前后分型的包含关系处理
        if ((K1.high < K2.high) && (K2.high > K3.high)) {
            assert(K1.low <= K2.low && K2.low >= K3.low, "顶分型的底不是最高的")
            return {
                time: K2.time,
                type: FractalType.Top,
                high: K2.high,
                low: K2.low,
                fxHigh: Math.max(K1.high, K2.high, K3.high),
                fxLow: Math.min(K1.low, K2.low, K3.low),
                highs: [K1.high, K2.high, K3.high],
                lows: [K1.low, K2.low, K3.low],
                candleIndex: K2.id,  // 注意保存的是 Candle Index
                barIndex: K2.barIndex
            }
        }

        if ((K1.low > K2.low) && (K2.low < K3.low)) {
            assert((K1.high >= K2.high) && (K2.high <= K3.high), "底分型的顶不是最低的")
            return {
                time: K2.time,
                type: FractalType.Bottom,
                high: K2.high,
                low: K2.low,
                fxHigh: Math.max(K1.high, K2.high, K3.high),
                fxLow: Math.min(K1.low, K2.low, K3.low),
                highs: [K1.high, K2.high, K3.high],
                lows: [K1.low, K2.low, K3.low],
                candleIndex: K2.id,
                barIndex: K2.barIndex
            }
        }

        return null
    }

    private fractal_included(F1: Fractal, F2: Fractal) {
        assert(F1.type !== F2.type)
        if ((F1.fxHigh >= F2.fxHigh && F1.fxLow <= F2.fxLow) || (F1.fxHigh <= F2.fxHigh && F1.fxLow >= F2.fxLow)) return true
        else return false
    }

    // 在Candles中，通过最后4个Candle，检测顶底分型
    // 这里有个细节需要注意，只有当第4根Candle生成后，第3根Candle的高低点才能完全确定
    private check_fractal(): Fractal | null {
        const len = this._candles.length
        assert(len >= 4)
        const K1 = this._candles[len - 4]
        const K2 = this._candles[len - 3]
        const K3 = this._candles[len - 2]

        assert(K1.high !== K2.high)
        assert(K2.high !== K3.high)
        assert(K1.low !== K2.low)
        assert(K2.low !== K3.low)

        return this.fractal_3k(K1, K2, K3)
    }

    private first_pen() {
        assert(this._store.pens.length === 0)
    }

    private pen_check() {
        if (this._store.pens.length === 0) {
            this.first_pen()
        }
    }

    // 笔检测算法
    // 1. 确定所有符合标准的分型
    // 2. 如果前后两分型是同一性质的，对于顶，前面的低于后面的，只保留后面的，前面那个可以X掉；
    //    对于底，前面的高于后面的，只保留后面的，前面那个可以X掉。
    //    不满足上面情况的，例如相等的，都可以先保留。
    // 3. 经过步骤二的处理后，余下的分型，如果相邻的是顶和底，那么这就可以划为一笔。

    // 细节一，看图
    // --0----------------------------------------------
    // --|------2---------------------------------------
    // -|-|-----|--3-------5----------------------------
    // ----|---|-|-|-------|----7-----------------------
    // -----|-|---|-|-----|-|---|-----------------------
    // ------|-------|---|---|-|-|----------------------
    // ------1--------|-|-----|-------------------------
    // ----------------|------6-------------------------
    // ----------------4--------------------------------
    // 当2出现的时候，如果1-2不能成笔，后续出现的顶或者底必须高于2或者低于1才有效，中间的，例如3，是无效，1-3不能成笔
    // 在这个例子里，0-1是一笔，但是没有结束，等4出现的时候，变成0-4是一笔，也没有结束，当5出现的时候4-5可以成一笔，也就确认里0-4一笔结束

    // 细节二，看图
    // -------------------------------------------------
    // --|------1----------5----------------------------
    // -|-|-----|--3-------|-7--------------------------
    // ----|---|-|-|-------|-｜-------------------------
    // -----|-|---|-|-----|-|---------------------------
    // ------|----2--|---|--6---------------------------
    // ---------------|-|-------------------------------
    // ----------------|--------------------------------
    // -------------------------------------------------
    // 图中有分型1，2，3，分别为顶分型，底分型，顶分型
    // 当2出现的时候，由于2与1共用K线，只能有一个分型有效，以先出来的分型为准，因此当前只有分型1，等分型3出现的时候，与分型1不共用K，因此有效
    // 当6出现的时候，由于5-6共用K线，同上述，6无效，
    // 当7出现的时候，与前一分型（分型5，此时6是无效分型）共用K线，如果7的高点高于5的高点，则7有效，5无效，反之，5有效
    // 因此图中有效的分型是1、3、5
    //
    // 总结规则
    // 当两个前后分型共用K时：
    // 规则1. 如果两个分型类型不同，以前分型为有效，后分型为无效分型
    // 规则2. 如果两个分型类型相同，以高低点决定那个分型有效

    // 符合标准的分型
    // 1. 细节二中确定的分型
    // 2. 转折力度不够的分型，以分型的高低点为区间，前包含后包含的分型都是不符合标准的分型
    // 3. 当顶底交替出现后，如果不能构成笔的话，就产生了一个中阴区间，如果今后出现的分型的高低点在此区间内，这忽略该分型

    // 细节三
    // 顶底是交替出现的，不可能出现只有2个底，中间没有顶的情况或者只出现两个顶，中间没有底

    // 细节四,看图
    // -----------2----------------------------------
    // -----------|-----------------------------------
    // ----0------|-----------------------------------
    // ----|------|-----------------------------------
    // ---|-|---|---|---------------------------------
    // --|---|--|----|------4-------------------------
    // -|-----|-|-----|-----|-------------------------
    // |-------|-------|---|--------------------------
    // --------1--------|-|---------------------------
    // ------------------|----------------------------
    // ------------------3----------------------------
    // 最极端的情况是，以下降笔为例，行情突然极端变动，形成顶分型，越过下降笔的高点，但是由于K线不足，不能构成笔，
    // 然后行情跌破笔的低点，形成底分型，最高点的顶分型和最低点的底分型可以构成下降笔
    // 图中0-1构成一笔，然后1-2不符合成笔条件，2-3符合成笔条件，3-4符合成笔条件
    // 最终结果是0-3为一笔，3-4为一笔



    private check_pen(pens: Pen[], f1: Fractal, f2: Fractal) {
        // 前顶后低 and 前高后低 and 距离足够
        // 这里的前高后低判断用于最严格的标准，即不允许前包含也不允许后包含
        if ((f1.type === FractalType.Top && f2.type === FractalType.Bottom) && (f1.fxLow > f2.fxLow && f1.fxHigh > f2.fxHigh) && (f2.index - f1.index >= 4)) {
            const newPen = {
                start: f1.time,
                end: f2.time,
                from: f1.barIndex,
                to: f2.barIndex,
                direction: Direction.Down,
                status: PenStatus.New
            }
            if (pens.length > 0) {
                const pen = pens[pens.length - 1]
                pen.status = PenStatus.Complete
            }

            pens.push(newPen)
            return newPen
        }

        // 前底后顶 and 前低后高 and 距离足够
        // 这里的前低后高判断用于最严格的标准，即不允许前包含也不允许后包含
        if ((f1.type === FractalType.Bottom && f2.type === FractalType.Top) && (f1.fxHigh < f2.fxHigh && f1.fxLow < f2.fxLow) && (f2.index - f1.index >= 4)) {
            const newPen = {
                start: f1.time,
                end: f2.time,
                from: f1.barIndex,
                to: f1.barIndex,
                direction: Direction.Up,
                status: PenStatus.New
            }
            if (pens.length > 0) {
                const pen = pens[pens.length - 1]
                pen.status = PenStatus.Complete
            }
            pens.push(newPen)
            return newPen
        }

        // 前顶后顶 and 前低后高
        if ((f1.type === FractalType.Top && f2.type === FractalType.Top) && (pens.length > 0) && (f1.fxHigh < f2.fxHigh)) {
            const pen = pens[pens.length - 1]
            pen.status = PenStatus.Continue
            pen.end = f2.time
            return pen
        }

        // 前底后底 and 前高后低
        if (f1.type === FractalType.Bottom && f2.type === FractalType.Bottom && (pens.length > 0) && (f1.fxLow > f2.fxLow)) {
            const pen = pens[pens.length - 1]
            pen.status = PenStatus.Continue
            pen.end = f2.time
            return pen
        }

        return null
    }

    // 确保相邻两个顶底之间不存在包含关系

    private update_pen(current: Fractal) {
        assert(this._fractals.length < 3)
        if (this._fractals.length === 0) {
            this._fractals.push(current)
            return null
        }

        const f1 = this._fractals[this._fractals.length - 1]

        const pen = this.check_pen(this._store.pens, f1, current)

        switch (pen?.status) {
            case PenStatus.New:
                this._fractals[0] = f1
                this._fractals[1] = current
                return pen

            case PenStatus.Continue:
                this._fractals[1] = current
                break;
        }

        return null
    }
}