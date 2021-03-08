
import {Bar, Candle, Fractal, FractalType} from './types'

function build_candle_from_bar(bar:Bar) {
    const candle = { 
        time: bar.time, 
        open: bar.open, 
        high: bar.high, 
        low: bar.low, 
        close: bar.close, 
        bars: [] 
    }
    return candle
}

// 处理K线的包含关系
function remove_include(k1: Candle, k2: Candle, k3:Bar ) {
    //TODO: 一字板与前后一根K的高低点相同或者连续一字板的情况没有考虑

    // 检测k2,k3的是否有包含关系
    if ((k3.high >= k2.high && k3.low <= k2.low) || (k3.high <= k2.high && k3.low <= k2.low)){
        // k2,k3有包含关系
        let _time: Date, _open: number, _high: number, _low: number, _close: number
        if(k1.high + k1.low > k2.high + k2.low){
            // 下包含，取低低
            _high = Math.min(k3.high, k2.high)
            _low = Math.min(k3.low, k2.low)
            _time = k2.low <= k3.low ? k2.time : k3.time
        }else {
            // 上包含，取高高
            _high = Math.max(k3.high, k2.high)
            _low = Math.max(k3.low, k2.low)
            _time = k2.high >= k3.high ? k2.time: k3.time
        }

        if (k3.open > k3.close){
            _open = _high
            _close = _low
        }else {
            _open = _low
            _close = _high
        }
        k2.bars.push(k3)
        const _candle = { time: _time, open: _open, high: _high, low: _low, close: _close,  bars: k2.bars }
        return { include: true, candle:_candle}
    }

    const _candle = { time: k3.time, open: k3.open, high: k3.high, low: k3.low, close: k3.close, bars: [] }

     return { include: false, candle:_candle }
}

// 检测顶底分型
function check_fractal(k1:Candle, k2:Candle, k3:Candle) {
    if ((k1.high < k2.high) && (k2.high > k3.high)) {
       // assert(K1.low <= K2.low && K2.low >= K3.low, "顶分型的底不是最高的")
       return {
           time: k2.time,
           type: FractalType.Top,
           high: k2.high,
           low: k2.low,
           fx: k2.high,
           elements:[k1,k2,k3]
       } 
    }

    if ((k1.low > k2.low) && (k2.low < k3.low)){
        // assert((K1.high >= K2.high) && (K2.high <= K3.high), "底分型的顶不是最低的")
        return {
            time: k2.time,
            type: FractalType.Bottom,
            high: k2.high,
            low: k2.low,
            fx: k2.low,
            elements:[k1,k2,k3]
        }
    }

    return null
}

function is_include(k1:Candle, k2:Bar | Candle){
    const included = (k1.high >= k2.high && k1.low <= k2.low) || (k1.high <= k2.high && k1.low <= k2.low)
    return included
}

/**
 * 
 * @param candles 经过包含处理过的K线数组
 * @param bar 当前K
 * @returns null代表没有检测到分型，否则返回检测到的分型
 */
export function update_fractal(candles: Candle[], bar:Bar) {
    const len = candles.length
    // 初始边界条件验证，前两个candle必须是非包含的
    switch(len){
        case 0: // 队列中没有K线
            candles.push(build_candle_from_bar(bar))
            return null
    
        case 1: // 仅有一根K线
            const included = is_include(candles[0], bar) 
            if (included){
                //存在包含关系，按照要求,抛弃队列中的Candle和现有的bar
                candles.pop()
                return null
            }
            // 不存在包含关系，符合要求，但是没有分型
            candles.push(build_candle_from_bar(bar))
            return null
    default:
         // 队列中有两个及以上的经过包含处理的K线
         const k1 = candles[len-2]
         const k2 = candles[len-1]
         
         const {include,candle} = remove_include(k1, k2,bar)

        if (include === true) {
            candles.pop()
            candles.push(candle)
            return null
        }

        candles.push(candle)

        return  check_fractal(k1, k2, candle)
    }
}