
/// <reference types="better-typescript" />
// / <reference path="../better-ts/index.d.ts" />
/// <reference path="./global.d.ts" />

const editor = document.querySelector(".editor");
const editorContainer = document.querySelector(".editor-container");
const overlayContainer = document.querySelector(".overlay");

// element.addEventListener("beforeinput", async (event) => {
// 	if (!event.dataTransfer) return;
// 	const dataTransferItem = [...event.dataTransfer.items].find(({ type }) => type === "text/plain");
// 	const [staticRange] = event.getTargetRanges();
// 	if (!staticRange || !dataTransferItem) return;
// 	event.preventDefault();
// 	const string = (await new Promise((resolve) => dataTransferItem.getAsString(resolve)))?.replaceAll("\r", "");
// 	if (!string) return;
// 	console.log(event, staticRange);
// 	const textNode = /** @type {Text} */ (staticRange.startContainer);
// 	textNode.insertData(staticRange.startOffset, string);
// 	document.getSelection().collapse(textNode, staticRange.startOffset + string.length);
// });

// const selectionElement = document.querySelector(".selection");
// const caretElement = document.querySelector(".caret");

const selectionsElement = document.querySelector(".selections");
const selectionFragment = selectionsElement.querySelector(":scope > template").content;

const caretsElement = document.querySelector(".carets");
const caretFragment = caretsElement.querySelector(":scope > template").content;

let carets = 0;

let /** @type {string} */ lastPressedKey;

const removeChildren = (/** @type {Element} */ element) => {
	for (const child of [...element.children]) {
		if (child.tagName !== "TEMPLATE") child.remove();
	}
};

const clamp = (/** @type {number} */ min, /** @type {number} */ value, /** @type {number} */ max) => (
	Math.max(min, Math.min(value, max))
);

const updateHighlighting = () => {
	console.debug("update highlighting");
	
	const selection = document.getSelection();

	if (selection.rangeCount === 0) {
		return;
	}

	const selectionRange = selection.getRangeAt(0);

	// console.debug(
	// 	selectionRange.startContainer, selectionRange.startOffset,
	// 	selectionRange.endContainer, selectionRange.endOffset,
	// )

	// const { x, y, width, height } = range.getBoundingClientRect();
	// if (selection.isCollapsed) {
	// 	caretElement.hidden = false;

	// 	caretElement.style.setProperty("--x", x);
	// 	caretElement.style.setProperty("--y", y);
	// 	caretElement.style.setProperty("--height", height);
	// } else {
	// 	caretElement.hidden = true;
	// }
	// // const range = selection.getRangeAt(0);
	// // const { x, y, width, height } = range.getBoundingClientRect();

	// // div.classList.add("selection");
	// selectionElement.style.setProperty("--x", x);
	// selectionElement.style.setProperty("--y", y);
	// selectionElement.style.setProperty("--width", width);
	// selectionElement.style.setProperty("--height", height);

	removeChildren(selectionsElement);

	// console.log(selectionRange);


	NodeIterator

	// for (const a of {
	// 	[Symbol.iterator]: function () {
	// 		return {
	// 			next() {
	// 				return { value: walker.nextNode() };
	// 			}
	// 		};
	// 	}
	// }) {
	// 	console.log(a);
	// }

	// $: if (selectionRange.startContainer === selectionRange.endContainer) {
	// 	// const range = document.createRange();
	// 	// range.setStart(selectionRange.startContainer, selectionRange.startOffset);
	// 	// range.setEnd(selectionRange.endContainer, selectionRange.endOffset);
	// 	// console.log(selectionRange, range);

	// 	// for (const { x, y, width, height } of selectionRange.getClientRects()) {
	// 	// 	const clone = selectionFragment.cloneNode(true);
	// 	// 	clone.querySelector(".selection").style.setProperty("--x", x);
	// 	// 	clone.querySelector(".selection").style.setProperty("--y", y);
	// 	// 	clone.querySelector(".selection").style.setProperty("--width", width);
	// 	// 	clone.querySelector(".selection").style.setProperty("--height", height);
	// 	// 	selectionsElement.append(clone);
	// 	// }
	// } else {

	const physicalEditorRect = overlayContainer.getBoundingClientRect();

	const getLayoutInfo = (/** @type {Range | Element} */ domItem) => {
		const node = domItem instanceof Range ? domItem.commonAncestorContainer : domItem;
		const element = node instanceof Element ? node : node.parentElement;
		const { writingMode, direction } = window.getComputedStyle(element);
		let /** @type {LogicalDOMRect[]} */ rects = [...domItem.getClientRects()].map(({ x, y, width, height }) => {
			x -= physicalEditorRect.x;
			y -= physicalEditorRect.y;
			return {
				inlineStart: direction === "ltr" ? x : physicalEditorRect.width - x - width,
				blockStart: y,
				inlineSize: width,
				blockSize: height,
			};
		});
		return { rects, direction, writingMode };
	}

	$handleCaretsOrSelection: if (selection.isCollapsed) {
		// const { x, y, width, height } = selectionRange.getBoundingClientRect();

		// const { x: editorX, y: editorY } = editor.getBoundingClientRect();

		let /** @type {Partial<LogicalDOMRect>} */ caretRect = {};

		const { direction, writingMode, fontSize } = window.getComputedStyle(selectionRange.commonAncestorContainer.parentElement);

		if (selectionRange.startContainer !== selectionRange.endContainer) {
			console.error(`caret start container is not caret end container`);
		}

		if (selectionRange.startOffset !== selectionRange.endOffset) {
			console.error(`caret start offset is not caret end offset`, selectionRange.startOffset, selectionRange.endOffset);
		}

		const offset = selectionRange.startOffset;

		// console.log("offset", offset);

		const container = selectionRange.startContainer;

		if (!editor.contains(container)) {
			carets = 0;
			removeChildren(caretsElement);
			break $handleCaretsOrSelection;
		}

		$getCaretRect: {
			const getClientRectsOfCaretOffset = (/** @type {number} */ caretOffset, /** @type {number} */ rangeLength = 1) => {
				// if (offset < 0 || offset >= container.length) return null;
				const length = /** @type {Text} */ (container).length || container.textContent.length;
				if (length === 0 && container instanceof Element) return getLayoutInfo(container).rects[0];
				const range = new Range();
				range.setStart(container, clamp(0, offset + caretOffset, length));
				range.setEnd(container, clamp(0, offset + caretOffset + rangeLength, length));
				const { rects } = getLayoutInfo(range);
				console.debug(rects);
				// if (rects.length > 1) console.debug(`caret range at offset ${caretOffset} has ${rects.length} client rects:`, rects);
				// return rects.at(caretOffset < 0 ? 0 : -1);
				// return rects.at(caretOffset < 0 ? -1 : 0);
				return rects.at(rangeLength < 1 ? -1 : 0);
				// return rects.at(0);
			}

			const rectBeforeCaret = getClientRectsOfCaretOffset(-1);
			const rectOfCaret = getClientRectsOfCaretOffset(0, 0)
			const rectAfterCaret = getClientRectsOfCaretOffset(0);

			console.debug(rectBeforeCaret, rectOfCaret, rectAfterCaret);
			// console.debug(rectBeforeCaret, rectOfCaret);

			// if (rectAfterCaret?.blockStart >= rectBeforeCaret?.blockStart + rectBeforeCaret?.blockSize / 2) {
			// if (rectAfterCaret?.blockStart >= rectBeforeCaret?.blockStart + rectBeforeCaret?.blockSize / 2) {
			if (rectOfCaret?.blockStart >= rectBeforeCaret?.blockStart + rectBeforeCaret?.blockSize / 2) {
				// caret is at the end of a wrapping line

				// console.debug("caret is at the end of a wrapping line")

				// if (lastPressedKey === "Home") {
				if (["End"].includes(lastPressedKey)) {
					caretRect.inlineStart = rectBeforeCaret.inlineStart + parseFloat(fontSize) / 4;
					caretRect.blockStart = rectBeforeCaret.blockStart;
					caretRect.blockSize = rectBeforeCaret.blockSize;
					break $getCaretRect;
				}
			}

			caretRect.inlineStart = rectOfCaret.inlineStart;
			caretRect.blockStart = rectOfCaret.blockStart;
			caretRect.blockSize = rectOfCaret.blockSize;
		}

		const caretElement = (() => {
			if (carets === 0) {
				carets = 1;
				const clone = caretFragment.cloneNode(true);
				const element = clone.querySelector(".caret");
				caretsElement.append(element);
				return element;
			}
			return caretsElement.querySelector(":scope > .caret");
		})();

		caretElement.style.setProperty("--direction", direction);
		caretElement.style.setProperty("--writing-mode", writingMode);
		caretElement.style.setProperty("--inline-start", caretRect.inlineStart);
		caretElement.style.setProperty("--block-start", caretRect.blockStart);
		caretElement.style.setProperty("--block-size", caretRect.blockSize);

		if (true) {
			{
				const range = new Range();
				range.setStart(container, offset - 2);
				range.setEnd(container, offset - 2);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[minus-2] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret.minus-2").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret.minus-2").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret.minus-2").style.setProperty("--block-size", rect.blockSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset - 1);
				range.setEnd(container, offset - 1);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[minus-1] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret.minus-1").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret.minus-1").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret.minus-1").style.setProperty("--block-size", rect.blockSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset);
				range.setEnd(container, offset);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[self] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret.self").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret.self").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret.self").style.setProperty("--block-size", rect.blockSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset + 1);
				range.setEnd(container, offset + 1);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[plus-1] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret.plus-1").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret.plus-1").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret.plus-1").style.setProperty("--block-size", rect.blockSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset + 2);
				range.setEnd(container, offset + 2);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[plus-2] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret.plus-2").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret.plus-2").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret.plus-2").style.setProperty("--block-size", rect.blockSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset - 2);
				range.setEnd(container, offset - 1);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[before-before] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret-range.before-before").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret-range.before-before").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret-range.before-before").style.setProperty("--block-size", rect.blockSize);
				caretsElement.querySelector(".temp-caret-range.before-before").style.setProperty("--inline-size", rect.inlineSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset - 1);
				range.setEnd(container, offset);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[before] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret-range.before").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret-range.before").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret-range.before").style.setProperty("--block-size", rect.blockSize);
				caretsElement.querySelector(".temp-caret-range.before").style.setProperty("--inline-size", rect.inlineSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset);
				range.setEnd(container, offset + 1);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[after] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret-range.after").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret-range.after").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret-range.after").style.setProperty("--block-size", rect.blockSize);
				caretsElement.querySelector(".temp-caret-range.after").style.setProperty("--inline-size", rect.inlineSize);
			}
			{
				const range = new Range();
				range.setStart(container, offset + 1);
				range.setEnd(container, offset + 2);
				const { rects } = getLayoutInfo(range);
				if (rects.length !== 1) console.log(`[after-after] rects length is not 1 but`, rects.length, rects);
				const rect = rects[0];
				caretsElement.querySelector(".temp-caret-range.after-after").style.setProperty("--inline-start", rect.inlineStart);
				caretsElement.querySelector(".temp-caret-range.after-after").style.setProperty("--block-start", rect.blockStart);
				caretsElement.querySelector(".temp-caret-range.after-after").style.setProperty("--block-size", rect.blockSize);
				caretsElement.querySelector(".temp-caret-range.after-after").style.setProperty("--inline-size", rect.inlineSize);
			}
		}

		// {
		// 	const range = new Range();
		// 	range.setStart(selectionRange.startContainer, selectionRange.startOffset - 1);
		// 	range.setEnd(selectionRange.startContainer, selectionRange.startOffset);
		// 	const { x: rangeX, y: rangeY, width: rangeWidth, height: rangeHeight } = range.getBoundingClientRect();
		// 	caretsElement.querySelector(".before-caret").style.setProperty("--x", rangeX - editorX);
		// 	caretsElement.querySelector(".before-caret").style.setProperty("--y", rangeY - editorY);
		// 	caretsElement.querySelector(".before-caret").style.setProperty("--width", rangeWidth);
		// 	caretsElement.querySelector(".before-caret").style.setProperty("--height", rangeHeight);
		// }

		// {
		// 	const range = new Range();
		// 	range.setStart(selectionRange.startContainer, selectionRange.startOffset);
		// 	range.setEnd(selectionRange.startContainer, selectionRange.startOffset + 1);
		// 	const { x: rangeX, y: rangeY, width: rangeWidth, height: rangeHeight } = range.getBoundingClientRect();
		// 	caretsElement.querySelector(".after-caret").style.setProperty("--x", rangeX - editorX);
		// 	caretsElement.querySelector(".after-caret").style.setProperty("--y", rangeY - editorY);
		// 	caretsElement.querySelector(".after-caret").style.setProperty("--width", rangeWidth);
		// 	caretsElement.querySelector(".after-caret").style.setProperty("--height", rangeHeight);
		// }

	} else {
		{
			carets = 0;
			removeChildren(caretsElement);
		}

		// let /** @type {Text} */ currentNode;
		// const walker = document.createTreeWalker(selectionRange.commonAncestorContainer, NodeFilter.SHOW_TEXT);
		const walker = document.createTreeWalker(selectionRange.commonAncestorContainer);
		while (walker.nextNode() && walker.currentNode !== selectionRange.startContainer);
		let isStartContainer = true;
		let isEndContainer = false;

		$loop: do {
			if (walker.currentNode === selectionRange.endContainer) isEndContainer = true;
			if (!(walker.currentNode instanceof Text)) continue $loop;
			const range = document.createRange();
			range.setStart(walker.currentNode, isStartContainer ? selectionRange.startOffset : 0);
			range.setEnd(walker.currentNode, isEndContainer ? selectionRange.endOffset : walker.currentNode.length);
			// console.log(range);

			// const { x: editorX, y: editorY } = editor.getBoundingClientRect();

			for (let { x, y, width, height } of range.getClientRects()) {
				// console.log(x,y);
				const clone = selectionFragment.cloneNode(true);
				clone.querySelector(".selection").style.setProperty("--x", x - physicalEditorRect.x);
				clone.querySelector(".selection").style.setProperty("--y", y - physicalEditorRect.y);
				clone.querySelector(".selection").style.setProperty("--width", width);
				clone.querySelector(".selection").style.setProperty("--height", height);
				selectionsElement.append(clone);
			}

			if (isEndContainer) break $loop;
			isStartContainer = false;
		} while (walker.nextNode());
	}
	// }

	// for (const { x, y, width, height } of range.getClientRects()) {
	// 	const clone = selectionFragment.cloneNode(true);
	// 	clone.querySelector(".selection").style.setProperty("--x", x);
	// 	clone.querySelector(".selection").style.setProperty("--y", y);
	// 	clone.querySelector(".selection").style.setProperty("--width", width);
	// 	clone.querySelector(".selection").style.setProperty("--height", height);
	// 	selectionsElement.append(clone);
	// }
};

document.addEventListener("selectionchange", () => {
	// console.debug("selectionchange")
	updateHighlighting()
});
window.addEventListener("resize", updateHighlighting);
editor.addEventListener("keydown", ({ key }) => {
	// console.debug(key)
	lastPressedKey = key;
});
window.addEventListener("blur", () => {
	carets = 0;
	removeChildren(caretsElement);
});
window.addEventListener("focus", updateHighlighting);
editor.addEventListener("input", ({ inputType }) => {
	if (["deleteContentBackward", "deleteContentForward"].includes(inputType)) {
		updateHighlighting();
	}
});

export { };
