
import { type Config as WinzigConfig } from "winzig";

winzigConfig: ({
	output: "../",
	appfiles: "appfiles",
	css: "./style.css",
	noCSSScopeRules: true,
}) satisfies WinzigConfig;

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

let handleCaret: CaretHandler;

// const $ = /** @type {Elements} */ (new Proxy({}, {
// 	get(_, /** @type {string} */ name) {
// 		const id = name.replaceAll(/(?<upperCaseLetter>\p{Lu})/ug, "-$<upperCaseLetter>").toLowerCase();
// 		console.log(id);
// 	},
// }));

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

const editor = <div className="editor" id="editor" contentEditable="true" spellcheck={false}>
	<div>Lorem ipsum dolor <span style="text-decoration-line: underline; text-decoration-thickness: 3px; text-decoration-style: dotted; text-decoration-color: limegreen;">sit</span> amet consectetur <u>adipisicing</u> elit. <span style="font-variant: small-caps;">Odit</span> ipsam qui <span style="font-weight: 900; -webkit-text-fill-color: var(--sheet); -webkit-text-stroke: 2px; paint-order: stroke fill; letter-spacing: -.1em;">ducimus</span> nisi <b>consequatur</b> quod laborum ullam <span style="background-color: color-mix(in srgb, peru, Canvas);">impedit</span>, non aut esse aperiam <s>laboriosam</s> a reprehenderit ratione <a href="#">consequuntur</a> ipsum <span style="border: 1px solid goldenrod;">explicabo</span> sed iste <i>voluptates</i> unde architecto. <span style="text-decoration-line: line-through; text-decoration-style: wavy; text-decoration-color: orangered;">Necessitatibus</span> quo <span style="font-weight: 900; font-family: cursive; color: transparent; background: linear-gradient(to right, deepskyblue, chartreuse) text;">doloribus</span>, consequuntur <u>adipisci <s>repellat</s></u><s> incidunt</s> eum animi eos impedit, eius <span style="color: red;">doloremque</span> veritatis suscipit provident vel. <a href="https://benjaminaster.com/">benjaminaster.com</a> Nisi ipsa iste pariatur corrupti delectus ratione, <span style="text-shadow: 2px 2px 2px red;">voluptatum</span> cupiditate fugit quis <span style="letter-spacing: 1px;">molestias</span>, perspiciatis aut tenetur <span style="text-transform: full-width;">reiciendis</span> ab repellendus qui alias ex quas animi quos libero ut tempore <span style="background: linear-gradient(to bottom right, white 0 49%, black 51% 100%);"><span style="color: white; mix-blend-mode: exclusion;">blanditiis</span></span> nihil. Iure facere aliquid perspiciatis quos dolores fugit enim nesciunt, veniam earum, molestias placeat eveniet culpa quas optio sit. Fuga, ducimus?</div>
	<div>Laboriosam alias, deserunt maiores debitis esse quasi praesentium tempora officiis impedit ipsam, iste veniam asperiores amet quae sequi ipsa deleniti sit sunt dolor velit dicta vel? Odit est earum dignissimos doloribus possimus dolore amet itaque voluptate illum neque laboriosam porro vitae sint sunt, distinctio labore et ab nisi fugiat harum quisquam blanditiis molestias? Fugit commodi ad illo molestias nesciunt? Et sunt accusamus dolore minima earum explicabo inventore voluptatum similique ducimus. Dolor, dolorem repellendus? Ab sapiente beatae consequatur hic cupiditate dolorem corrupti quidem voluptates vero quisquam pariatur illo, suscipit voluptatibus saepe eveniet maiores explicabo ut. Eligendi quibusdam officiis maxime corporis accusantium.</div>
	<div>Cumque accusantium facilis, similique tempora aut fugit architecto sed possimus beatae! Numquam reprehenderit corporis quidem id impedit praesentium itaque obcaecati, dolores ipsam, ea ullam amet, inventore perspiciatis aspernatur voluptates sed pariatur delectus doloremque modi veniam? Exercitationem consequatur maiores voluptatem iusto dolorum, minus facilis temporibus culpa fugiat ex id laboriosam totam, aspernatur atque recusandae libero architecto ratione quam distinctio vel. Perspiciatis fugit, commodi accusamus quos natus at ipsa nihil sit dolorum architecto placeat, necessitatibus nemo magni incidunt pariatur molestias suscipit rerum doloribus voluptatibus temporibus fugiat rem. Asperiores ea, consequuntur repudiandae culpa optio ad ut, cum quaerat repellendus illo, qui natus velit.</div>
	<div>Possimus corporis ipsum voluptas delectus dolores, expedita facilis distinctio ea ullam, recusandae illo quod beatae debitis ducimus obcaecati praesentium, voluptatibus a fuga non doloribus doloremque incidunt deleniti ratione? Ex facilis voluptatum cum! Accusamus iste eligendi facilis, officia saepe impedit consequuntur libero cum vero doloremque exercitationem voluptatibus minima laboriosam modi unde necessitatibus id fugiat. Reprehenderit numquam excepturi modi! Possimus, quis molestias quaerat non accusamus quisquam eveniet aperiam quo est, aut amet dolore ipsa beatae! Hic, porro minima dicta, nulla consectetur asperiores dolores illo soluta eligendi quaerat maxime? Enim vero commodi quasi aliquam, atque, nam incidunt nemo fugiat ex reiciendis quisquam! Modi!</div>
</div>;

// const isTouch = window.matchMedia("(hover: none)").matches;
// editor.addEventListener("contextmenu", (event) => {
// 	if (isTouch) event.preventDefault();
// });


const selectionsElement = <div className="selections" />;
const SelectionHighlight = () => {
	return <div className="selection" />;
};

const caretsElement = <div className="carets" />;
const Caret = () => {
	return <div className="caret" />;
};

const overlayContainer = <div className="overlay">
	{caretsElement}
	{selectionsElement}
</div>;

const isApple = (
	["iphone", "ipad", "macintosh", "macintel", "mac", "macos", "ios", "iphoneos", "ipados"]
).includes((navigator.userAgentData?.platform || navigator.platform).toLowerCase());

let engine = (() => {
	if (navigator.userAgentData?.brands?.some(({ brand }) => brand === "Chromium") || navigator.userAgent.includes(" Chrome/")) return "blink";
	if (navigator.userAgent.includes(" Firefox/")) return "gecko";
	if (navigator.userAgent.includes(" AppleWebKit/")) return "webkit";
	return "blink";
})();

const browserCompatibilitySwitcher = <select id="browser-compatibility">
	<option value="blink">Chromium</option>
	<option value="webkit">WebKit</option>
	<option value="gecko">Firefox</option>
</select> as HTMLSelectElement;

{
	// const filePaths = {
	// 	blink: import.meta.resolve("./engines/blink.js"),
	// 	webkit: import.meta.resolve("./engines/webkit.js"),
	// 	gecko: import.meta.resolve("./engines/gecko.js"),
	// };
	const updateBrowserCompatibility = async () => {
		// ({ handleCaret } = await import(filePaths[engine]));
		({ handleCaret } = await import("./engines/blink.ts"));
	};
	updateBrowserCompatibility();
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

const documentLanguageSwitcher = <select id="document-language">
	<option value="no-spellcheck">No spellcheck</option>
	<option value="en">English</option>
	<option value="de">Deutsch</option>
</select> as HTMLSelectElement;

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

export let lastPressedKey: string;
// let wasAtLineStartPreviously = false;
let currentCaretBlinkingTimeoutId: number;
export let prevCaretRect: LogicalDOMRect;
let warnBeforeClosing = false;

const removeChildren = (element: Element) => {
	// for (const child of [...element.children]) {

	// 	// if (child.localName !== "template") child.remove();
	// }
	element.textContent = "";
};

export const clamp = (min: number, value: number, max: number) => (
	Math.max(min, Math.min(value, max))
);

export let physicalEditorRect: DOMRect;

const _expose = (object: Record<string, any>) => {
	for (const [key, value] of Object.entries(object)) (self as any)[key] = value;
};

const nextTreeNodeNotInside = (node: Node): Node => node.nextSibling ?? nextTreeNodeNotInside(node.parentNode);
export const nextTreeNode = (node: Node) => node.firstChild ?? nextTreeNodeNotInside(node);

const previousTreeNodeNotOutside = (node: Node): Node => node.lastChild ? previousTreeNodeNotOutside(node.lastChild) : node;
export const previousTreeNode = (node: Node) => node.previousSibling ? previousTreeNodeNotOutside(node.previousSibling) : node.parentNode;

_expose({ nextTreeNode, previousTreeNode });

export const getLayoutInfo = (domItem: Range | Element) => {
	// console.log(domItem.commonAncestorContainer)
	const node = domItem instanceof Range ? domItem.commonAncestorContainer : domItem;
	const element = node instanceof Element ? node : node.parentElement;
	const { writingMode, direction } = window.getComputedStyle(element);
	let rects: LogicalDOMRect[] = [...domItem.getClientRects()].map(({ x, y, width, height }) => {
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
};

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
				const element = <Caret />;
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
				const clone = <SelectionHighlight />;
				clone.style.setProperty("--inline-start", inlineStart);
				clone.style.setProperty("--block-start", blockStart);
				clone.style.setProperty("--inline-size", inlineSize);
				clone.style.setProperty("--block-size", blockSize);
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

let wordCount$ = 0;

const updateWordCount = () => {
	wordCount$ = [...segmenter.segment([...editor.children].map(child => child.textContent).join(" "))].filter(i => i.isWordLike).length;
};

editor.addEventListener("input", ({ inputType, ...rest }) => {
	// console.debug("input", inputType);

	// await 0;

	// console.time("checkinputtype")

	warnBeforeClosing = true;

	console.log(inputType, rest);

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

const handleExecCommand = (commandId: ExecCommandCommandId) => {
	highlightAlreadyUpdated = true;
	// console.debug("before execcommand")
	// TODO: replace execCommand() with a non-buggy, non-non-standardized, interoperable, self-made implementation
	document.execCommand(commandId);
	// console.debug("execcommand finished")
	updateHighlighting();
	// console.debug("highlight update after execcommand finished")
};

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

// document.querySelector("#bold").addEventListener("click", () => {
// 	handleExecCommand("bold");
// });

// document.querySelector("#italic").addEventListener("click", () => {
// 	handleExecCommand("italic");
// });

// document.querySelector("#underline").addEventListener("click", () => {
// 	handleExecCommand("underline");
// });

// document.querySelector("#strikethrough").addEventListener("click", () => {
// 	handleExecCommand("strikethrough");
// });

export const storage = new class {
	#pathname = new URL(document.baseURI).pathname;
	get(key: string) {
		try {
			return JSON.parse(localStorage.getItem(`${this.#pathname}:${key}`));
		} catch (error) {
			console.error(error);
			return null;
		}
	};
	set(key: string, value: any) {
		localStorage.setItem(`${this.#pathname}:${key}`, JSON.stringify(value));
	};
	remove(key: string) {
		localStorage.removeItem(`${this.#pathname}:${key}`);
	};
};

const themeSwitcherButton = <button id="theme-switcher" title="Toggle light theme"></button>;

{
	// color theme
	const mediaMatch = window.matchMedia("(prefers-color-scheme: light)");
	const themeInStorage = storage.get("color-theme") ?? "os-default";
	let currentTheme = ((themeInStorage === "os-default" && mediaMatch.matches) || themeInStorage === "light") ? "light" : "dark";
	const themeColorMeta = (document.getElementById("theme-color-meta") ?? {}) as HTMLMetaElement;

	const updateTheme = () => {
		document.documentElement.dataset.theme = currentTheme === "light" ? "light" : "dark";
		const themeColor = window.getComputedStyle(document.documentElement).backgroundColor.trim();
		themeColorMeta.content = themeColor;
	};
	updateTheme();

	themeSwitcherButton.addEventListener("click", async () => {
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

const Header = () => {
	return <header>
		<div className="app-titlebar">
			<div className="inner">
				<img src="./assets/icon.svg" className="icon" alt="icon of Wort" />
				Wort
			</div>
		</div>

		<div className="header-inner">
			<button id="bold" on:click={() => handleExecCommand("bold")} title="Toggle bold (Ctrl+B)">
				<code><b>B</b></code>
			</button>
			<button id="italic" on:click={() => handleExecCommand("italic")} title="Toggle italic (Ctrl+I)">
				<code><i>I</i></code>
			</button>
			<button id="underline" on:click={() => handleExecCommand("underline")} title="Toggle underline (Ctrl+U)">
				<code><u>U</u></code>
			</button>
			<button id="strikethrough" on:click={() => handleExecCommand("strikethrough")} title="Toggle strikethrough (Ctrl+Shift+S)">
				<code><s>S</s></code>
			</button>
			<div className="space"></div>
			<img src="./assets/icon.svg" className="icon" alt="icon of Wort" id="wort-icon" on:dblclick={() => {
				if (document.fullscreenElement) document.exitFullscreen();
				else document.documentElement.requestFullscreen();
			}} />
		</div>
	</header>;
};

const Main = () => {
	return <main>
		<div className="editor-container">
			{overlayContainer}
			{editor}
		</div>
	</main>;
};

const Footer = () => {
	return <footer lang="en">
		<div className="side">
			<div>
				<span id="word-count">{wordCount$}</span> words
			</div>
			<label>
				Language: {documentLanguageSwitcher}
			</label>
		</div>
		<div className="side">
			<label title="Change the browser compatibility mode">
				Browser: {browserCompatibilitySwitcher}
			</label>
			<div>
				{themeSwitcherButton}
			</div>
		</div>
	</footer>;
};

<html lang="en">
	<head>
		<title>Wort</title>
		<link rel="icon" href="./assets/icon.svg" type="image/svg+xml" sizes="any" />
		<link rel="icon" href="./assets/icon.png" type="image/png" sizes="512x512" />
		<meta name="theme-color" content="#191516" id="theme-color-meta" />

		<meta name="robots" content="all" />
		<meta name="author" content="Benjamin Aster" />
		<meta name="description" content="A simple Microsoft Word alternative" />
		<link rel="code-repository" href="https://github.com/BenjaminAster/wort" />
		<meta property="og:image" content="https://benjaminaster.com/wort/assets/screenshot-desktop.png" />
		<meta name="twitter:card" content="summary_large_image" />

		<title>Wort</title>
		<base href="./" />
		<link rel="manifest" href="./app.webmanifest" />
	</head>
	<body>
		<Header />
		<Main />
		<Footer />
	</body>
</html>;
