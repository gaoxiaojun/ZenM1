/**
 * 线段
 *
 * 线段至少连续的三笔组成，并且线段的前三笔有重异部分，线段由奇数笔组成
 * 线段被破坏：当且仅当至少被有重叠部分的连续三笔的其中一笔破坏。线段破坏的充要条件，就是被另一个线段破坏。
 *
 * 特征序列：简单说向上线段的向下笔，向下线段的向上笔，就叫该线段的特征序列。
 * 特征序列包含关系：
 * 处理办法：前提是这些元素都在同一特征序列里
 * 包含就是一个特征序列的高低点完全在另一个特征序列的范围里，按特征序列所在线段的方向，线段向上，则向上包含，反之向下包含。
 * 向上时，两者高点取其高做高点，两者低点取其高做低点，这样就把两个特征序列合并成另一个新的特征序列；
 * 向下时，两者低点取其低做底点，两者高点取其低做高点，这样就把两个特征序列合并成另一个新的特征序列。
 *
 * 特征序列包含和K线包含基本是一样的，唯一不同的就是：
 * 特征序列分型中无缺口有包含关系时不能向假设分界点前包含，
 * 特征序列的分型中有缺口并且有包含关系时，在假设分界点后的第二个特征序列可以向前包含一笔。
 *
 * 线段的划分都可以当下完成，
 * 假设某转折点是两线段的分界点，然后对此用线段划分的两种情况去考察是否满足，
 * 如果满足其中一种，那么这点就是真正的线段的分界点；
 * 如果两种情况都不满足，那就不是，原来的线段依然延续，就这么简单
 *
 * 第一种情况：
 * 特征序列的顶分型中，第一和第二元素间不存在特征序列的缺口，那么该线段在该顶分型的高点处结束，该高点是该线段的终点；
 * 特征序列的底分型中，第一和第二元素间不存在特征序列的缺口，那么该线段在该底分型的低点处结束，该低点是该线段的终点；
 *
 * 第二种情况：
 * 特征序列的顶分型中，第一和第二元素间存在特征序列的缺口，如果从该分型最高点开始的向下一笔开始的序列的特征序列出现底分型，那么该线段在该顶分型的高点处结束，该高点是该线段的终点；
 * 特征序列的底分型中，第一和第二元素间存在特征序列的缺口，如果从该分型最低点开始的向上一笔开始的序列的特征序列出现顶分型，那么该线段在该底分型的低点处结束，该低点是该线段的终点。
 *
 */

/**
 * 特征序列计算伪代码：
 * 已知两特征序列s1(x1,y1, x2,y2)、s0(x1,y1, x2,y2)，向上合并:
if 前小后大 and 方向是\\ then
    return 特征序列s(s1.x2,s1.y2, s2.x1,s2.y1)
else if 前小后大 and 方向是/\ then
    return 特征序列s(s1.x1,s1.y1, s2.x1,s2.y1)
else if 前大后小 and 方向是\\ then
    return 特征序列s(s1.x1,s1.y1, s2.x2,s2.y2)
else if 前大后小 and 方向是/\ then
    return 特征序列s(s1.x2,s1.y2, s2.x2,s2.y2)

已知两特征序列s1(x1,y1, x2,y2)、s0(x1,y1, x2,y2)，向下合并:
if 前小后大 and 方向是// then
    return 特征序列s(s1.x2,s1.y2, s2.x1,s2.y1)
else if 前小后大 and 方向是\/ then
    return 特征序列s(s1.x1,s1.y1, s2.x1,s2.y1)
else if 前大后小 and 方向是// then
    return 特征序列s(s1.x1,s1.y1, s2.x2,s2.y2)
else if 前大后小 and 方向是\/ then
    return 特征序列s(s1.x2,s1.y2, s2.x2,s2.y2)
 */

/**
 * 特征序列分型伪代码
 * 特征序列分型于k线分型一样，三根特征序列前上后下形成顶分型或者前下后上形成底分型；
 * 不同之处在于特征序列够三根立即开始分型判定，而不是等第4根特征序列出现后才开始判定。
if 存在3个已合并之后的向下特征序列k3,k2,k1 then
    if k3,k2向上 and k2,k1向下 then
        return 顶分型(k2的时间,k2的最高价)
    else
        return 不是顶分型        

if 存在3个已合并之后的向上特征序列k3,k2,k1 then
    if k3,k2向下 and k2,k1向上 then
        return 顶分型(k2的时间,k2的最高价)
    else
        return 不是底分型    
 */

// 最新的笔不参与特征序列合并和分型处理过程，只用来确认前一反向特征序列完成。

/*
完成了特征序列的合并与分型之后，我们直接连接所有找出的分型会发现:

在顶分型之后有四种可能：更低的底分型、更高的底分型或更低的顶分型、更高的顶分型；
在底分型之后也有两种可能：更高顶分型、更低的顶分型或更高的底分型、更低的底分型；
*/

/**
 * 笔、线段这两种“线”在存储和计算是都有一个共同的特征，那就是只要记录该“线”终点的横坐标、纵坐标、类型(顶或底)，
 */
/**
 * 线段伪代码
 * 新的顶分型t出现时：
if 前点g不存在 then
    return g(t.x, t.y, t.type)
else if 前点g是顶分型 and t.y>g.y then
    replace(g, t.x, t.y) # 这里的含义是用t的属性覆盖g的，但g的唯一标识不变，以此来标识原g的延伸
    return g(x, y, type)
else if 前点g是底分型 and t.y>g.y then
    return g(t.x, t.y, t.type)

新的底分型t出现时：
if 前点g不存在 then
    return g(t.x, t.y, t.type)
else if 前点是底分型 and t.y<g.y then
    replace(g, t.x, t.y) # 这里的含义是用t的属性覆盖g的，但g的唯一标识不变，以此来标识原g的延伸
    return g(x, y, type)
else if 前点是顶分型 and t.y<g.y then
    return g(t.x, t.y, t.type)
 */
import { assert } from './assert'
import { Pen, Segment,Sequence,SequenceMergeDirection } from './types'

export function update_segment(segments: Segment[], pen: Pen) {

}

function merge_sequence_up(s1: Sequence, s2: Sequence) : Sequence{
    const size1 = Math.abs(s1.y2 - s1.y1)
    const size2 = Math.abs(s2.y2 - s2.y1)
    const dir1 = s1.y2 - s1.y1
    const dir2 = s2.y2 - s1.y1 //TODO
    assert(dir1 != 0)
    assert(dir2 > 0)
    assert(size1 != size2) // 这个假设合理吗？
    const direction = dir1 > 0 ? 1: 0 // 1 代表是\\ 0 代表 /\

    if ((size1 < size2 ) && (direction === 1)) {
        return {
            x1: s1.x2,
            y1: s1.y2,
            x2: s2.x1,
            y2: s2.y1
        }

    }else if ((size1 < size2) && (direction === 0)) {
        return {
            x1: s1.x1,
            y1: s1.y1,
            x2: s2.x1,
            y2: s2.y1
        }

    }else if ((size1 > size2) && (direction ===1)) {
        return {
            x1: s1.x1,
            y1: s1.y1,
            x2: s2.x2,
            y2: s2.y2
        }

    }else {
        assert((size1 > size2) && (direction === 0))
        return {
            x1: s1.x2,
            y1: s1.y2,
            x2: s2.x2,
            y2: s2.y2
        }

    }
}

function merge_sequence_down(s1: Sequence, s2: Sequence) : Sequence {
    const size1 = Math.abs(s1.y2 - s1.y1)
    const size2 = Math.abs(s2.y2 - s2.y1)
    const dir1 = s1.x2 - s1.x1
    const dir2 = s2.x2 - s1.x1
    assert(dir1 != 0)
    assert(dir2 > 0)
    assert(size1 != size2) // 这个假设合理吗？
    const direction = dir1 > 0 ? 1: 0 // 1 代表是// 0 代表 \/

    if ((size1 < size2 ) && (direction === 1)) {
        return {
            x1: s1.x2,
            y1: s1.y2,
            x2: s2.x1,
            y2: s2.y1
        }

    }else if ((size1 < size2) && (direction === 0)) {
        return {
            x1: s1.x1,
            y1: s1.y1,
            x2: s2.x1,
            y2: s2.y1
        }

    }else if ((size1 > size2) && (direction ===1)) {
        return {
            x1: s1.x1,
            y1: s1.y1,
            x2: s2.x2,
            y2: s2.y2
        }

    }else {
        assert((size1 > size2) && (direction === 0))
        return {
            x1: s1.x2,
            y1: s1.y2,
            x2: s2.x2,
            y2: s2.y2
        }

    }
}

function sequence_fractal(k1: Sequence, k2: Sequence, k3: Sequence){
    const k21dir = k2.y2 - k1.y2
}