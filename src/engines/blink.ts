
import {
	clamp, getLayoutInfo, lastPressedKey, prevCaretRect, nextTreeNode,
	type LogicalDOMRect, type CaretHandler,
} from "../index.tsx";

export const handleCaret: CaretHandler = ({ startOffset: offset, startContainer: container }: Range) => {

	let caretRect: LogicalDOMRect = {};

	const { direction, writingMode, fontSize, fontStyle } = window.getComputedStyle(container instanceof Element ? container : container.parentElement);

	const isHigherUpThan = (rect1: LogicalDOMRect, rect2: LogicalDOMRect) => (
		rect1.blockStart + rect1.blockSize
		<
		rect2.blockStart + rect2.blockSize / 3
	);

	const getRectsFromRange = (container: Node, start: number, length: number = 0) => {
		const contentLength = container.textContent.length;
		if (contentLength === 0 && container instanceof Element) return getLayoutInfo(container).rects;
		const range = new Range();
		range.setStart(container, clamp(0, start, contentLength));
		range.setEnd(container, clamp(0, start + length, contentLength));
		const { rects } = getLayoutInfo(range);
		return rects;
	};

	const getRectsFromRelativeRange = (start: number, length: number = 0) => {
		return getRectsFromRange(container, offset + start, length);
	};

	let node = container;
	const caretHoversOnEnd = lastPressedKey === "End";
	let rects = caretHoversOnEnd ? getRectsFromRelativeRange(-1, 0) : getRectsFromRelativeRange(0, 1);
	while (rects.length === 0) {
		console.log(node);
		do node = nextTreeNode(node);
		while (node.nodeType !== Node.TEXT_NODE || (node as Text).length === 0);
		rects = getRectsFromRange(node, 0, 0);
		console.log(node);
	}

	caretRect.inlineStart = rects[0].inlineStart;
	if (caretHoversOnEnd) caretRect.inlineStart += parseFloat(fontSize) / 4;
	caretRect.blockStart = rects[0].blockStart;
	caretRect.blockSize = rects[0].blockSize;

	return { caretRect, fontStyle };

};
