/**
 * 缠论中的笔处理
 * 以下两种情况代表新笔生成：
 *  1. 前顶后底,距离足够,前高后低,下降笔生成
 *  2. 前底后顶,距离足够,前低后高,上升笔生成
 *
 * 以下两种情况代表笔延续
 *  1.前顶后顶,前低后高,上升笔延伸
 *  2.前底后底,前高后低,下降笔延伸
 *
 * 其它情况没有影响，忽略

伪代码：
已知前笔pen(t3, t2)，后点t1:
if 前顶后低 and 距离足够 and 前高后低 then
    return 下降笔(t2, t1, 下降)
else if 前底后顶 and 距离足够 and 前低后高 then
    return 上升笔(t2, t1, 上升)
else if 前顶后顶 and 前低后高 then
    return pen(t3, t1, 上升)
else if 前底后底 and 前高后低 then
    return pen(t3, t1, 下降)

边界条件要注意第一笔的产生
*/

import { Pen, FractalType, Fractal, PenType, PenStatus } from './types'
import { assert } from './assert'

function check_pen(pens: Pen[], f1: Fractal, f2: Fractal) {
    // 前顶后低 and 前高后低 and 距离足够
    if ((f1.type === FractalType.Top) && (f2.type === FractalType.Bottom) && (f1.fx > f2.fx)) {
        const distance = f2.index - f1.index
        if (distance >= 4) {
            const new_pen = {
                start: f1,
                end: f2,
                type: PenType.Down,
                status: PenStatus.New
            }
            if (pens.length > 0) {
                const pen = pens[pens.length - 1]
                pen.status = PenStatus.Complete
            }

            pens.push(new_pen)
            return new_pen
        }
    }

    // 前底后顶 and 前低后高 and 距离足够
    if ((f1.type === FractalType.Bottom) && (f2.type === FractalType.Top) && (f1.fx < f2.fx)) {
        const distance = f2.index - f1.index
        if (distance >= 4) {
            const new_pen = {
                start: f1,
                end: f2,
                type: PenType.Up,
                status: PenStatus.New
            }
            if (pens.length > 0) {
                const pen = pens[pens.length - 1]
                pen.status = PenStatus.Complete
            }
            pens.push(new_pen)
            return new_pen

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

export function update_pen(pens: Pen[], fractals: Fractal[], current: Fractal) {
    assert(fractals.length < 2)
    if (fractals.length === 0) {
        fractals.push(current)
        return null
    }

    const f1 = fractals[fractals.length - 1]

    const pen = check_pen(pens, f1, current)

    switch (pen?.status) {
        case PenStatus.New:
            fractals[0] = pen.start
            fractals[1] = current
            return pen

        case PenStatus.Continue:
            fractals[1] = current
            break;
    }

    return null
}