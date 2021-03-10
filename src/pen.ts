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

/*
以下两种新笔生成：
1. 前顶后底,距离足够,前高后低,下降笔生成
2. 前底后顶,距离足够,前低后高,上升笔生成

以下两种与距离无关：
1.前顶后顶,前低后高,上升笔延伸
2.前底后底,前高后低,下降笔延伸

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

边界条件是第一笔的产生
*/
import { Pen, FractalType,Fractal, PenType, PenStatus } from './types'
import { assert } from './assert'

function check_pen(pens: Pen[], f1: Fractal, f2:Fractal){
    // 前顶后低 and 前高后低 and 距离足够 
    if ((f1.type === FractalType.Top ) && (f2.type === FractalType.Bottom) && (f1.fx > f2.fx)) {
        const distance = f2.index - f1.index
        if (distance > 2) {
            const new_pen = {
                start:f1,
                end:f2,
                type:PenType.Down,
                status:PenStatus.New
            }
            if (pens.length > 0) {
                const pen = pens[pens.length -1]
                pen.status = PenStatus.Complete
            }
                
            pens.push(new_pen)
            return new_pen
        }
    }

    // 前底后顶 and 前低后高 and 距离足够
    if ((f1.type === FractalType.Bottom ) && (f2.type === FractalType.Top) && (f1.fx < f2.fx)) {
        const distance = f2.index- f1.index
        if (distance > 2) {
                const new_pen = {
                    start:f1,
                    end:f2,
                    type:PenType.Up,
                    status:PenStatus.New
                }
                if(pens.length > 0) {
                    const pen = pens[pens.length -1]
                    pen.status = PenStatus.Complete
                }
                pens.push(new_pen)
                return new_pen
            
        }
    }

    // 前顶后顶 and 前低后高
    if (f1.type === FractalType.Top && f2.type === FractalType.Top && (pens.length > 0) &&(f1.fx < f2.fx)) {
        const pen = pens[pens.length -1]
        pen.status = PenStatus.Continue
        pen.end = f2
        return pen
    }

    // 前底后底 and 前高后低
    if (f1.type === FractalType.Bottom && f2.type === FractalType.Bottom && (pens.length > 0) && (f1.fx > f2.fx)) {
        const pen = pens[pens.length -1]
        pen.status = PenStatus.Continue
        pen.end = f2
        return pen
    }

    return null
}

export function update_pen(pens: Pen[], fractals: Fractal[], current:Fractal) {
    assert(fractals.length < 2)
      if (fractals.length === 0 ){
          fractals.push(current)
          return null
      }

      const f1 = fractals[fractals.length - 1]

      const pen = check_pen(pens, f1, current)

      switch(pen?.status) {
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