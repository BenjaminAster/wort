
/// <reference types="better-typescript" />
// / <reference path="../better-ts/index.d.ts" />
/// <reference path="./global.d.ts" />

const editor = document.querySelector(".editor");
// const editorContainer = document.querySelector(".editor-container");
const overlayContainer = document.querySelector(".overlay");

const selectionsElement = document.querySelector(".selections");
const selectionFragment = selectionsElement.querySelector(":scope > template").content;

const caretsElement = document.querySelector(".carets");
const caretFragment = caretsElement.querySelector(":scope > template").content;

let carets = 0;

let /** @type {string} */ lastPressedKey;

let /** @type {number} */ currentCaretBlinkingTimeoutId;

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
	} else if (selection.rangeCount > 1) {
		console.error(`selection has not one but ${selection.rangeCount} ranges`, selection);
	}

	const selectionRange = selection.getRangeAt(0);

	removeChildren(selectionsElement);

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
		let /** @type {Partial<LogicalDOMRect>} */ caretRect = {};

		if (
			selectionRange.startContainer !== selectionRange.endContainer
			||
			selectionRange.startContainer !== selectionRange.commonAncestorContainer
		) {
			console.error(`caret end container or common ancestor container is not start container`);
		}

		if (selectionRange.startOffset !== selectionRange.endOffset) {
			console.error(`caret start offset is not caret end offset`, selectionRange.startOffset, selectionRange.endOffset);
		}

		const offset = selectionRange.startOffset;

		const container = selectionRange.startContainer;

		const { direction, writingMode, fontSize, fontStyle } = window.getComputedStyle(container instanceof Element ? container : container.parentElement);

		if (!editor.contains(container)) {
			carets = 0;
			removeChildren(caretsElement);
			break $handleCaretsOrSelection;
		}

		const getRectsFromRelativeRange = (/** @type {number} */ start, /** @type {number} */ length = 0) => {
			const contentLength = container.textContent.length;
			if (contentLength === 0 && container instanceof Element) return getLayoutInfo(container).rects;
			const range = new Range();
			range.setStart(container, clamp(0, offset + start, contentLength));
			range.setEnd(container, clamp(0, offset + start + length, contentLength));
			const { rects } = getLayoutInfo(range);
			return rects;
		}

		const rectToCompare1 = getRectsFromRelativeRange(-1).at(-1);
		const rectToCompare2 = getRectsFromRelativeRange(0)[1] ?? getRectsFromRelativeRange(0, 1)[0];

		if (
			rectToCompare1 && rectToCompare2
			&& (
				rectToCompare1.blockStart + rectToCompare1.blockSize
				<
				rectToCompare2.blockStart + rectToCompare2.blockSize / 3
			)
		) {
			if (lastPressedKey === "End") {
				caretRect.inlineStart = rectToCompare1.inlineStart + parseFloat(fontSize) / 3;
				caretRect.blockStart = rectToCompare1.blockStart;
				caretRect.blockSize = rectToCompare1.blockSize;
			} else {
				caretRect.inlineStart = rectToCompare2.inlineStart;
				caretRect.blockStart = rectToCompare2.blockStart;
				caretRect.blockSize = rectToCompare2.blockSize;
			}
		} else {
			const rectOfCaret = getRectsFromRelativeRange(0)[0];
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

		caretElement.style.setProperty("--inline-start", caretRect.inlineStart);
		caretElement.style.setProperty("--block-start", caretRect.blockStart);
		caretElement.style.setProperty("--block-size", caretRect.blockSize);
		caretElement.classList.toggle("italic", fontStyle === "italic");

		caretElement.classList.remove("blink");
		if (currentCaretBlinkingTimeoutId) window.clearTimeout(currentCaretBlinkingTimeoutId);
		currentCaretBlinkingTimeoutId = window.setTimeout(() => {
			caretElement.classList.add("blink");
			currentCaretBlinkingTimeoutId = null;
		}, 700);
	} else {
		{
			carets = 0;
			removeChildren(caretsElement);
		}

		console.time("treewalkerfind");
		const container = selectionRange.commonAncestorContainer;
		if (!editor.contains(container)) {
			break $handleCaretsOrSelection;
		}
		const walker = document.createTreeWalker(container);
		while (walker.nextNode() && walker.currentNode !== selectionRange.startContainer);
		console.timeEnd("treewalkerfind");
		let isStartContainer = true;
		let isEndContainer = false;

		$loop: do {
			if (walker.currentNode === selectionRange.endContainer) isEndContainer = true;
			if (!(walker.currentNode instanceof Text)) continue $loop;
			const range = document.createRange();
			range.setStart(walker.currentNode, isStartContainer ? selectionRange.startOffset : 0);
			range.setEnd(walker.currentNode, isEndContainer ? selectionRange.endOffset : walker.currentNode.length);

			for (let { inlineStart, blockStart, inlineSize, blockSize } of getLayoutInfo(range).rects) {
				const clone = selectionFragment.cloneNode(true);
				clone.querySelector(".selection").style.setProperty("--inline-start", inlineStart);
				clone.querySelector(".selection").style.setProperty("--block-start", blockStart);
				clone.querySelector(".selection").style.setProperty("--inline-size", inlineSize);
				clone.querySelector(".selection").style.setProperty("--block-size", blockSize);
				selectionsElement.append(clone);
			}

			if (isEndContainer) break $loop;
			isStartContainer = false;
		} while (walker.nextNode());
	}
};

document.addEventListener("selectionchange", () => {
	updateHighlighting();
});

window.addEventListener("resize", updateHighlighting);

editor.addEventListener("keydown", ({ key }) => {
	lastPressedKey = key;
});

window.addEventListener("blur", () => {
	carets = 0;
	removeChildren(caretsElement);
});

window.addEventListener("focus", updateHighlighting);

editor.addEventListener("input", ({ inputType }) => {
	console.log(inputType);

	console.time("checkinputtype")

	if ([
		"deleteWordBackward",
		"deleteWordForward",
		"deleteSoftLineBackward",
		"deleteSoftLineForward",
		"deleteEntireSoftLine",
		"deleteHardLineBackward",
		"deleteHardLineForward",
		"deleteByDrag",
		"deleteByCut",
		"deleteContent",
		"deleteContentBackward",
		"deleteContentForward",
	].includes(inputType)) {
		console.timeEnd("checkinputtype");
		updateHighlighting();
	} else {
		console.timeEnd("checkinputtype");
	}
});

export { };
