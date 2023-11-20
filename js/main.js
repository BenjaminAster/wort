
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
let warnBeforeClosing = false;

const removeChildren = (/** @type {Element} */ element) => {
	for (const child of [...element.children]) {
		if (child.tagName !== "TEMPLATE") child.remove();
	}
};

const clamp = (/** @type {number} */ min, /** @type {number} */ value, /** @type {number} */ max) => (
	Math.max(min, Math.min(value, max))
);

const updateHighlighting = () => {
	// console.debug("%cupdate highlighting", "color: cadetblue");

	const selection = document.getSelection();

	if (selection.rangeCount === 0) {
		return;
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
			// TODO: actually handle directions and writing modes
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
			// console.error(`caret end container or common ancestor container is not start container`);
		}

		if (selectionRange.startOffset !== selectionRange.endOffset) {
			// console.error(`caret start offset is not caret end offset`, selectionRange.startOffset, selectionRange.endOffset);
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
let tooManySelectionchangesMightFollow = false; // circumvent WebKit bug (dispatches 3 selectionchange events)
let prevRealSelectionchangeTime = 0;

document.addEventListener("selectionchange", () => {
	// console.debug("selectionchange", performance.now());

	if (highlightAlreadyUpdated) {
		highlightAlreadyUpdated = false;
		prevRealSelectionchangeTime = performance.now();
		tooManySelectionchangesMightFollow = true;
		return;
	};

	if (tooManySelectionchangesMightFollow) {
		if (performance.now() < prevRealSelectionchangeTime + 20) return;
		tooManySelectionchangesMightFollow = false;
	}

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

editor.addEventListener("beforeinput", event => {
	// console.debug("beforeinput", event)
});

if (!Intl.Segmenter) await import("./segmenter-polyfill.js");
const segmenter = new Intl.Segmenter(["en"], { granularity: "word" });

const updateWordCount = () => {
	const wordCount = [...segmenter.segment([...editor.children].map(child => child.textContent).join(" "))].filter(i => i.isWordLike).length;
	document.querySelector("#word-count").textContent = wordCount.toString();
};

editor.addEventListener("input", ({ inputType }) => {
	// console.debug("input", inputType);

	// await 0;

	// console.time("checkinputtype")

	warnBeforeClosing = true;

	if ([
		// https://w3c.github.io/input-events/#interface-InputEvent-Attributes
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

	if (segmenter) updateWordCount();
});

if (segmenter) updateWordCount();

window.addEventListener("beforeunload", (event) => {
	if (warnBeforeClosing) event.returnValue = true;
});

const handleExecCommand = (/** @type {ExecCommandCommandId} */ commandId) => {
	highlightAlreadyUpdated = true;
	// console.debug("before execcommand")
	// TODO: replace execCommand() with a non-buggy, non-non-standardized, interoperable, self-made implementation
	document.execCommand(commandId);
	// console.debug("execcommand finished")
	updateHighlighting();
	// console.debug("highlight update after execcommand finished")
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

document.querySelector("header").addEventListener("pointerdown", (event) => {
	event.preventDefault();
});

document.querySelector("#bold").addEventListener("click", () => {
	handleExecCommand("bold");
});

document.querySelector("#italic").addEventListener("click", () => {
	handleExecCommand("italic");
});

document.querySelector("#underline").addEventListener("click", () => {
	handleExecCommand("underline");
});

document.querySelector("#strikethrough").addEventListener("click", () => {
	handleExecCommand("strikethrough");
});

export const storage = new class {
	#pathname = new URL(document.baseURI).pathname;
	get(/** @type {string} */ key) {
		try {
			return JSON.parse(localStorage.getItem(`${this.#pathname}:${key}`));
		} catch (error) {
			console.error(error);
			return null;
		}
	};
	set(/** @type {string} */ key, /** @type {any} */ value) {
		localStorage.setItem(`${this.#pathname}:${key}`, JSON.stringify(value));
	};
	remove(/** @type {string} */ key) {
		localStorage.removeItem(`${this.#pathname}:${key}`);
	};
};

{
	const button = document.querySelector("button#theme-switcher");

	// color theme
	const mediaMatch = window.matchMedia("(prefers-color-scheme: light)");
	const themeInStorage = storage.get("color-theme") ?? "os-default";
	let currentTheme = ((themeInStorage === "os-default" && mediaMatch.matches) || themeInStorage === "light") ? "light" : "dark";

	const updateTheme = () => {
		document.documentElement.dataset.theme = currentTheme === "light" ? "light" : "dark";
		const themeColor = window.getComputedStyle(document.documentElement).backgroundColor.trim();
		document.querySelector("meta[name=theme-color]").content = themeColor;
	};
	updateTheme();

	button.addEventListener("click", async () => {
		currentTheme = currentTheme === "dark" ? "light" : "dark";
		storage.set("color-theme", ((currentTheme === "light") === mediaMatch.matches) ? "os-default" : currentTheme);
		updateTheme();
	});

	mediaMatch.addEventListener("change", ({ matches }) => {
		currentTheme = matches ? "light" : "dark";
		storage.set("color-theme", "os-default");
		updateTheme();
	});
}

export { };
