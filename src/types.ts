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
export interface Candle extends Bar {
    bars: Bar[]
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
    fx: number,
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

enum SegmentType {
    Up,
    Down
}
// 线段
export interface Segment {
    pens: Pen[],
    type: SegmentType
}