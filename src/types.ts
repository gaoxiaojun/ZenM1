// 公用类型

// 未经过包含处理的K线
export interface Bar {
    time:Date,
    open:number,
    high:number,
    low:number,
    close:number
}

// 经过包含处理的K线
export interface Candle extends Bar {
    bars:Bar[]
}

// 分型
export enum FractalType {
    Top,
    Bottom
}

export interface Fractal {
    time: Date,
    type: FractalType,
    high: number,
    low: number,
    fx: number,
    elements: Candle[],
}

// 笔
export enum LineType {
    Up,
    Down
}

export interface Line {
    from: Fractal,
    to: Fractal,
    type: LineType,
    isComplete: boolean
}


// 线段
export interface Segment {

}