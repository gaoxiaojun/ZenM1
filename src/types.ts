// 公用类型

// 未经过包含处理的K线
export interface Bar {
    time: number,   // Date.getTime()
    open: number,
    high: number,
    low: number,
    close: number
}

export enum Direction {
    Up,
    Down
}

// 笔
export enum PenStatus {
    New,
    Continue,
    Complete
}

export interface Pen {
    start: number,
    end: number,
    direction: Direction,
    status: PenStatus
}

// 线段
export interface Segment {
    pens: Pen[],
    direction: Direction
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