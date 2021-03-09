// 缠论中的笔处理

/**
 * 笔(多K线组合形态)
 * 两个相邻的顶和底，并且顶和底之间至少有一根K线，这样就构成一笔。也就是说，经过包含处理后，一笔至少有5根K线。
 *
 * 处理办法：
 * 1. 确定所有符合标准的分型
 * 2. 如果前后两个分型是同一性质的，对于顶，前面的低于后面的，只保留后面的，前面哪个可以 X 掉，
 *    对于底，前面的高于后面的，只保留后面的，前面那个可以 X 掉，不满足上面情况的，例如相等，都可以先保留
 * 3. 经过步骤二的处理后，余下的分型，如果相邻的是顶和底，那么就可以划为一笔.
 *
 *    经过上面的三个步骤，所有的笔都可以唯一地划分出来。
 *
 *    如果相邻的性质一样，那么必然有前顶不低于后顶，前底不高于后底，而在连续的顶后，必须会出现新的底，
 *    把这连续的顶中最先一个，和这新出现的底连在一起，就是新的一笔，而中间的那些顶，都X掉；
 *    在连续的底后，必须会出现新的顶，把这连续的底中最先一个，和这新出现的顶连在一起，就是新的一笔，
 *    而中间的那些底，都X掉。
 */

import { Fractal, FractalType } from './types'
import { assert } from './assert'

export function update_line(fractals: Fractal[], current: Fractal) {
    const len = fractals.length

    switch (len) {
        case 0:
            fractals.push(current)
            return null;
        case 1:
        case 2:
            const last = fractals[fractals.length - 1]
            // step 2
            if (last.type === current.type) {
                if (last.type === FractalType.Top) {
                    if (last.high < current.high) {
                        fractals.pop();
                        fractals.push(current);
                        return null
                    }
                } else {
                    if (last.low > current.low) {
                        fractals.pop()
                        fractals.push(current)
                    }
                }
            }
            break;
        case 3:

        default:
            throw new Error('笔的分型缓冲区长度不对')
    }

    return null
}