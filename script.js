
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

const isApple = [
	"iPhone",
	"iPad",
	"Macintosh",
	"MacIntel",
	"Mac",
	"macOS",
	"iOS",
	"iPhoneOS",
	"iPadOS",
].includes(navigator.userAgentData?.platform || navigator.platform);

let carets = 0;

let /** @type {string} */ lastPressedKey;
// let wasAtLineStartPreviously = false;
let /** @type {number} */ currentCaretBlinkingTimeoutId;
let /** @type {Partial<LogicalDOMRect>} */ prevCaretRect;

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

	if (currentCaretBlinkingTimeoutId) window.clearTimeout(currentCaretBlinkingTimeoutId);

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

		// console.log(container)

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
			// console.debug(rects)
			return rects;
		};

		const isHigherUpThan = (/** @type {Partial<LogicalDOMRect>} */ rect1, /** @type {Partial<LogicalDOMRect>} */ rect2) => (
			rect1.blockStart + rect1.blockSize
			<
			rect2.blockStart + rect2.blockSize / 3
		);

		const rectsOfCaret = getRectsFromRelativeRange(0);
		const rectToCompare1 = getRectsFromRelativeRange(-1).at(-1);
		const rectToCompare2 = rectsOfCaret[1] ?? getRectsFromRelativeRange(0, 1)[0];

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
		} else {
			caretRect.inlineStart = rectsOfCaret[0].inlineStart;
			caretRect.blockStart = rectsOfCaret[0].blockStart;
			caretRect.blockSize = rectsOfCaret[0].blockSize;
			// wasAtLineStartPreviously = false;
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
		currentCaretBlinkingTimeoutId = window.setTimeout(() => {
			caretElement.classList.add("blink");
			currentCaretBlinkingTimeoutId = null;
		}, 700);

		prevCaretRect = caretRect;
	} else {
		{
			carets = 0;
			removeChildren(caretsElement);
			// wasAtLineStartPreviously = false;
		}

		// console.time("treewalkerfind");
		const container = selectionRange.commonAncestorContainer;
		if (!editor.contains(container)) {
			break $handleCaretsOrSelection;
		}
		const walker = document.createTreeWalker(container);
		while (walker.nextNode() && walker.currentNode !== selectionRange.startContainer);
		// console.timeEnd("treewalkerfind");
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

let highlightAlreadyUpdated = false;

document.addEventListener("selectionchange", async () => {
	console.debug("selectionchange");
	await 0;
	if (highlightAlreadyUpdated) {
		highlightAlreadyUpdated = false;
		return;
	};
	updateHighlighting();
});

window.addEventListener("resize", updateHighlighting);

editor.addEventListener("keydown", async ({ key }) => {
	lastPressedKey = key;
});

window.addEventListener("blur", async () => {
	carets = 0;
	removeChildren(caretsElement);
});

window.addEventListener("focus", updateHighlighting);

editor.addEventListener("input", async ({ inputType }) => {
	console.debug("input", inputType);

	await 0;

	// console.time("checkinputtype")

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
		// console.timeEnd("checkinputtype");
		updateHighlighting();
	} else {
		// console.timeEnd("checkinputtype");
	}
});

const handleExecCommand = (/** @type {ExecCommandCommandId} */ commandId) => {
	highlightAlreadyUpdated = true;
	console.debug("before execcommand")
	document.execCommand(commandId);
	console.debug("execcommand finished")
	updateHighlighting();
	console.debug("highlight update after execcommand finished")
}

window.addEventListener("keydown", (event) => {
	if (event.ctrlKey === !isApple && event.metaKey === isApple && !event.altKey) {
		if (event.shiftKey) {
			if (event.key === "S") {
				event.preventDefault();
				handleExecCommand("strikethrough");
			}
		} else {
			if (event.key === "b") {
				event.preventDefault();
				handleExecCommand("bold");
			} else if (event.key === "i") {
				event.preventDefault();
				handleExecCommand("italic");
			} else if (event.key === "u") {
				event.preventDefault();
				handleExecCommand("underline");
			}
		}
	}
});

document.querySelector("button#bold").addEventListener("click", () => {
	handleExecCommand("bold");
});

document.querySelector("button#italic").addEventListener("click", () => {
	handleExecCommand("italic");
});

document.querySelector("button#underline").addEventListener("click", () => {
	handleExecCommand("underline");
});

document.querySelector("button#strikethrough").addEventListener("click", () => {
	handleExecCommand("strikethrough");
});

{
	let lightTheme = window.matchMedia("(prefers-color-scheme: light)").matches;
	const updateTheme = () => {
		document.documentElement.dataset.theme = lightTheme ? "light" : "dark";
	};
	const checkbox = document.querySelector("input[type=checkbox]#light-theme");
	checkbox.checked = lightTheme;
	checkbox.addEventListener("change", () => {
		lightTheme = checkbox.checked;
		updateTheme();
	});
	updateTheme();
}

export { };
