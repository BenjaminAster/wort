
/** @import { LogicalDOMRect, CaretHandler, Elements } from "./global.d" */

console

let /** @type {CaretHandler} */ handleCaret;

const $ = /** @type {Elements} */ (new Proxy({}, {
	get(_, /** @type {string} */ name) {
		const id = name.replaceAll(/(?<upperCaseLetter>\p{Lu})/ug, "-$<upperCaseLetter>").toLowerCase();
		console.log(id);
	},
}));



{
	const div = document.createElement("div");
	div.classList.add("highlight-inheritance-test");
	const child = document.createElement("div");
	div.append(child);
	document.body.append(div);
	if (window.getComputedStyle(div, "::selection").color !== window.getComputedStyle(child, "::selection").color) {
		document.documentElement.classList.add("no-highlight-inheritance");
	}
	div.remove();
}

const editor = document.querySelector(".editor");
const overlayContainer = document.querySelector(".overlay");

const isTouch = window.matchMedia("(hover: none)").matches
editor.addEventListener("contextmenu", (event) => {
	if (isTouch) event.preventDefault();
};


const selectionsElement = document.querySelector(".selections");
const selectionFragment = selectionsElement.querySelector(":scope > template").content;

const caretsElement = document.querySelector(".carets");
const caretFragment = caretsElement.querySelector(":scope > template").content;

const isApple = (
	["iphone", "ipad", "macintosh", "macintel", "mac", "macos", "ios", "iphoneos", "ipados"]
).includes((navigator.userAgentData?.platform || navigator.platform).toLowerCase());

let engine = (() => {
	if (navigator.userAgentData?.brands?.some(({ brand }) => brand === "Chromium") || /\bChrome\b/.test(navigator.userAgent)) return "blink";
	if (/\bFirefox\b/.test(navigator.userAgent)) return "gecko";
	if (/\bAppleWebKit\b/.test(navigator.userAgent)) return "webkit";
	return "blink";
})();

{
	const filePaths = {
		blink: import.meta.resolve("./engines/blink.js"),
		webkit: import.meta.resolve("./engines/webkit.js"),
		gecko: import.meta.resolve("./engines/gecko.js"),
	};
	const updateBrowserCompatibility = async () => {
		({ handleCaret } = await import(filePaths[engine]));
	};
	updateBrowserCompatibility();
	const browserCompatibilitySwitcher = document.querySelector("select#browser-compatibility");
	browserCompatibilitySwitcher.value = engine;
	browserCompatibilitySwitcher.addEventListener("input", () => {
		if (browserCompatibilitySwitcher.value !== engine) {
			engine = browserCompatibilitySwitcher.value;
			updateBrowserCompatibility();
		}
	});
	browserCompatibilitySwitcher.addEventListener("pointerleave", () => {
		if (browserCompatibilitySwitcher.value !== engine) {
			engine = browserCompatibilitySwitcher.value;
			updateBrowserCompatibility();
		}
	});
}

{
	let documentLanguage = "no-spellcheck";
	const updateDocumentLanguage = async () => {
		if (documentLanguage === "no-spellcheck") {
			editor.spellcheck = false;
			editor.lang = "en";
			document.documentElement.lang = "en";
		} else {
			editor.spellcheck = true;
			editor.lang = documentLanguage;
			document.documentElement.lang = documentLanguage;
		}
	};
	const documentLanguageSwitcher = document.querySelector("select#document-language");
	documentLanguageSwitcher.addEventListener("input", () => {
		if (documentLanguageSwitcher.value !== documentLanguage) {
			documentLanguage = documentLanguageSwitcher.value;
			updateDocumentLanguage();
		}
	});
	documentLanguageSwitcher.addEventListener("pointerleave", () => {
		if (documentLanguageSwitcher.value !== documentLanguage) {
			documentLanguage = documentLanguageSwitcher.value;
			updateDocumentLanguage();
		}
	});
}

let carets = 0;

export let /** @type {string} */ lastPressedKey;
// let wasAtLineStartPreviously = false;
let /** @type {number} */ currentCaretBlinkingTimeoutId;
export let /** @type {LogicalDOMRect} */ prevCaretRect;
let warnBeforeClosing = false;

const removeChildren = (/** @type {Element} */ element) => {
	for (const child of [...element.children]) {
		if (child.localName !== "template") child.remove();
	}
};

export const clamp = (/** @type {number} */ min, /** @type {number} */ value, /** @type {number} */ max) => (
	Math.max(min, Math.min(value, max))
);

export let /** @type {DOMRect} */ physicalEditorRect;

const _expose = (/** @type {Record<string, any>} */ object) => {
	for (const [key, value] of Object.entries(object)) self[key] = value;
};

const nextTreeNodeNotInside = (/** @type {Node} */ node) => node.nextSibling ?? nextTreeNodeNotInside(node.parentNode);
export const nextTreeNode = (/** @type {Node} */ node) => node.firstChild ?? nextTreeNodeNotInside(node);

const previousTreeNodeNotOutside = (/** @type {Node} */ node) => node.lastChild ? previousTreeNodeNotOutside(node.lastChild) : node;
export const previousTreeNode = (/** @type {Node} */ node) => node.previousSibling ? previousTreeNodeNotOutside(node.previousSibling) : node.parentNode;

_expose({ nextTreeNode, previousTreeNode })

export const getLayoutInfo = (/** @type {Range | Element} */ domItem) => {
	// console.log(domItem.commonAncestorContainer)
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

const updateHighlighting = () => {
	// console.debug("%cupdate highlighting", "color: cadetblue");

	const selection = document.getSelection();

	if (selection.rangeCount === 0) {
		return;
	}

	const selectionRange = selection.getRangeAt(0);

	removeChildren(selectionsElement);

	physicalEditorRect = overlayContainer.getBoundingClientRect();

	if (currentCaretBlinkingTimeoutId) self.clearTimeout(currentCaretBlinkingTimeoutId);

	$handleCaretsOrSelection: if (selection.isCollapsed) {
		if (!editor.contains(selectionRange.startContainer)) {
			carets = 0;
			removeChildren(caretsElement);
			break $handleCaretsOrSelection;
		}

		const { caretRect, fontStyle } = handleCaret(selectionRange);

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
		currentCaretBlinkingTimeoutId = self.setTimeout(() => {
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

const segmenter = new Intl.Segmenter(["en"], { granularity: "word" });

const updateWordCount = () => {
	const wordCount = [...segmenter.segment([...editor.children].map(child => child.textContent).join(" "))].filter(i => i.isWordLike).length;
	document.querySelector("#word-count").textContent = wordCount.toString();
};

editor.addEventListener("input", ({ inputType, ...rest }) => {
	// console.debug("input", inputType);

	// await 0;

	// console.time("checkinputtype")

	warnBeforeClosing = true;

	console.log(inputType, rest)

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
		"insertLineBreak",
		"insertParagraph",
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
	if (warnBeforeClosing) event.preventDefault();
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

for (const button of document.querySelectorAll(".header-inner > button[id]")) {
	button.addEventListener("pointerdown", (event) => {
		event.preventDefault();
	});
}

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

{
	const mediaMatch = window.matchMedia("(hover)");
	const update = () => {
		document.documentElement.classList.toggle("can-hover", mediaMatch.matches);
	};
	mediaMatch.addEventListener("change", update);
	update();
}

{
	document.querySelector("img#wort-icon").addEventListener("dblclick", () => {
		if (document.fullscreenElement) document.exitFullscreen();
		else document.documentElement.requestFullscreen();
	});
}

export { };
