
export interface LogicalDOMRect {
	inlineStart?: number;
	blockStart?: number;
	inlineSize?: number;
	blockSize?: number;
}

export type CaretHandler = (range: Range) => {
	caretRect: LogicalDOMRect;
	fontStyle: string;
};

export interface Elements {
	editor: HTMLElement;
}
