
/** @import { LogicalDOMRect, CaretHandler } from "../global.d" */

import { clamp, getLayoutInfo, lastPressedKey, prevCaretRect } from "../main.js";

export const /** @type {CaretHandler} */ handleCaret = (/** @type {Range} */ { startOffset: offset, startContainer: container }) => {

	let /** @type {LogicalDOMRect} */ caretRect = {};

	const { direction, writingMode, fontSize, fontStyle } = window.getComputedStyle(container instanceof Element ? container : container.parentElement);

	const isHigherUpThan = (/** @type {LogicalDOMRect} */ rect1, /** @type {LogicalDOMRect} */ rect2) => (
		rect1.blockStart + rect1.blockSize
		<
		rect2.blockStart + rect2.blockSize / 3
	);

	const getRectsFromRelativeRange = (/** @type {number} */ start, /** @type {number} */ length = 0) => {
		const contentLength = container.textContent.length;
		if (contentLength === 0 && container instanceof Element) return getLayoutInfo(container).rects;
		const range = new Range();
		range.setStart(container, clamp(0, offset + start, contentLength));
		range.setEnd(container, clamp(0, offset + start + length, contentLength));
		const { rects } = getLayoutInfo(range);
		// console.debug(rects)
		return rects;
	};

	const rectsOfCaret = getRectsFromRelativeRange(0);
	const rectToCompare1 = getRectsFromRelativeRange(-1).at(-1);
	const rectToCompare2 = rectsOfCaret[1] ?? getRectsFromRelativeRange(0, 1)[0];

	// console.log(container, offset);

	// console.log(getRectsFromRelativeRange(0, 0));

	if (
		rectToCompare1 && rectToCompare2
		&& isHigherUpThan(rectToCompare1, rectToCompare2)
	) {
		if (
			lastPressedKey === "End"
			||
			(lastPressedKey === "ArrowDown" && isHigherUpThan(prevCaretRect, rectToCompare1))
			||
			(lastPressedKey === "ArrowUp" && !isHigherUpThan(rectToCompare2, prevCaretRect))
		) {
			caretRect.inlineStart = rectToCompare1.inlineStart + parseFloat(fontSize) / 3;
			caretRect.blockStart = rectToCompare1.blockStart;
			caretRect.blockSize = rectToCompare1.blockSize;
			// wasAtLineStartPreviously = false;
		} else {
			caretRect.inlineStart = rectToCompare2.inlineStart;
			caretRect.blockStart = rectToCompare2.blockStart;
			caretRect.blockSize = rectToCompare2.blockSize;
			// console.debug("%cat line start", "color: cyan");
			// wasAtLineStartPreviously = true;
		}
	} else if (rectsOfCaret[0]) {
		caretRect.inlineStart = rectsOfCaret[0].inlineStart;
		caretRect.blockStart = rectsOfCaret[0].blockStart;
		caretRect.blockSize = rectsOfCaret[0].blockSize;
		// wasAtLineStartPreviously = false;
	} else {
		console.error("no caret rect");
	}

	return { caretRect, fontStyle };

}
