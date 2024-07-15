
/** @import { LogicalDOMRect, CaretHandler } from "../global.d" */

import { clamp, getLayoutInfo, lastPressedKey, prevCaretRect, nextTreeNode } from "../main.js";

export const /** @type {CaretHandler} */ handleCaret = (/** @type {Range} */ { startOffset: offset, startContainer: container }) => {

	let /** @type {LogicalDOMRect} */ caretRect = {};

	const { direction, writingMode, fontSize, fontStyle } = window.getComputedStyle(container instanceof Element ? container : container.parentElement);

	const isHigherUpThan = (/** @type {LogicalDOMRect} */ rect1, /** @type {LogicalDOMRect} */ rect2) => (
		rect1.blockStart + rect1.blockSize
		<
		rect2.blockStart + rect2.blockSize / 3
	);

	const getRectsFromRange = (/** @type {Node} */ container, /** @type {number} */ start, /** @type {number} */ length = 0) => {
		const contentLength = container.textContent.length;
		if (contentLength === 0 && container instanceof Element) return getLayoutInfo(container).rects;
		const range = new Range();
		range.setStart(container, clamp(0, start, contentLength));
		range.setEnd(container, clamp(0, start + length, contentLength));
		const { rects } = getLayoutInfo(range);
		return rects;
	};

	const getRectsFromRelativeRange = ( /** @type {number} */ start, /** @type {number} */ length = 0) => {
		return getRectsFromRange(container, offset + start, length);
	};

	let node = container;
	const caretHoversOnEnd = lastPressedKey === "End";
	let rects = caretHoversOnEnd ? getRectsFromRelativeRange(-1, 0) : getRectsFromRelativeRange(0, 1);
	while (rects.length === 0) {
		console.log(node)
		do node = nextTreeNode(node);
		while (node.nodeType !== Node.TEXT_NODE || /** @type {Text} */ (node).length === 0);
		rects = getRectsFromRange(node, 0, 0);
		console.log(node)
	}

	caretRect.inlineStart = rects[0].inlineStart;
	if (caretHoversOnEnd) caretRect.inlineStart += parseFloat(fontSize) / 4;
	caretRect.blockStart = rects[0].blockStart;
	caretRect.blockSize = rects[0].blockSize;

	return { caretRect, fontStyle };

}
