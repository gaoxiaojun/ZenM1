// 公用类型

// 未经过包含处理的K线
export interface Bar {
    time: number,   // Date.getTime()
    open: number,
    high: number,
    low: number,
    close: number
}

// 经过包含处理的K线
export interface Candle {
    id: number,
    time: number,
    high: number,
    low: number,
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
    fxLow: number
    index: number   // 分型中心candle在Candles数组中的索引
}

// 笔
export enum PenType {
    Up,
    Down
}

export enum PenStatus {
    New,
    Continue,
    Complete
}

export interface Pen {
    start: Fractal,
    end: Fractal,
    type: PenType,
    status: PenStatus
}

export enum SegmentType {
    Up,
    Down
}
// 线段
export interface Segment {
    pens: Pen[],
    type: SegmentType
}

export enum SequenceMergeDirection {
    Up,
    Down
}
// 特征序列
export interface Sequence {
    // 横坐标代表时间,纵坐标代表价格
    // (x1,y1)代表起点 (x2,y2)代表终点
    x1: number,
    y1: number,
    x2: number,
    y2: number
}