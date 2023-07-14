
/// <reference types="better-typescript" />

const editor = document.querySelector(".editor");

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

const removeChildren = (/** @type {Element} */ element) => {
	for (const child of element.querySelectorAll(":scope > :not(template)")) {
		child.remove();
	}
};

const updateHighlighting = () => {
	console.log("updating highlighting");

	const selection = document.getSelection();

	const selectionRange = selection.getRangeAt(0);
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

	if (selection.isCollapsed) {
		const { x, y, width, height } = selectionRange.getBoundingClientRect();

		const { x: editorX, y: editorY } = editor.getBoundingClientRect();

		caretsElement.hidden = false;

		{
			const range = new Range();
			range.setStart(selectionRange.startContainer, selectionRange.startOffset - 1);
			range.setEnd(selectionRange.startContainer, selectionRange.startOffset);
			const { x: rangeX, y: rangeY, width: rangeWidth, height: rangeHeight } = range.getBoundingClientRect();
			caretsElement.querySelector(".before-caret").style.setProperty("--x", rangeX - editorX);
			caretsElement.querySelector(".before-caret").style.setProperty("--y", rangeY - editorY);
			caretsElement.querySelector(".before-caret").style.setProperty("--width", rangeWidth);
			caretsElement.querySelector(".before-caret").style.setProperty("--height", rangeHeight);
		}

		{
			const range = new Range();
			range.setStart(selectionRange.startContainer, selectionRange.startOffset);
			range.setEnd(selectionRange.startContainer, selectionRange.startOffset + 1);
			const { x: rangeX, y: rangeY, width: rangeWidth, height: rangeHeight } = range.getBoundingClientRect();
			caretsElement.querySelector(".after-caret").style.setProperty("--x", rangeX - editorX);
			caretsElement.querySelector(".after-caret").style.setProperty("--y", rangeY - editorY);
			caretsElement.querySelector(".after-caret").style.setProperty("--width", rangeWidth);
			caretsElement.querySelector(".after-caret").style.setProperty("--height", rangeHeight);
		}

		// const caretElement = (() => {
		// 	if (carets === 0) {
		// 		carets = 1;
		// 		const clone = caretFragment.cloneNode(true);
		// 		const element = clone.querySelector(".caret");
		// 		caretsElement.append(element);
		// 		return element;
		// 	}
		// 	return caretsElement.querySelector(":scope > .caret");
		// })();

		// caretElement.hidden = false;

		// caretElement.style.setProperty("--x", x);
		// caretElement.style.setProperty("--y", y);
		// caretElement.style.setProperty("--width", width);
		// caretElement.style.setProperty("--height", height);
	} else {
		{
			// carets = 0;
			// removeChildren(caretsElement);
		}
		caretsElement.hidden = true;

		// let /** @type {Text} */ currentNode;
		const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
		while (walker.nextNode() && walker.currentNode !== selectionRange.startContainer);
		let isStartContainer = true;
		let isEndContainer = false;

		$loop: do {
			if (walker.currentNode === selectionRange.endContainer) isEndContainer = true;
			const range = document.createRange();
			range.setStart(walker.currentNode, isStartContainer ? selectionRange.startOffset : 0);
			range.setEnd(walker.currentNode, isEndContainer ? selectionRange.endOffset : walker.currentNode.length);
			// console.log(range);

			const { x: editorX, y: editorY } = editor.getBoundingClientRect();

			for (let { x, y, width, height } of range.getClientRects()) {
				// console.log(x,y);
				const clone = selectionFragment.cloneNode(true);
				clone.querySelector(".selection").style.setProperty("--x", x - editorX);
				clone.querySelector(".selection").style.setProperty("--y", y - editorY);
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

document.addEventListener("selectionchange", updateHighlighting);
window.addEventListener("resize", updateHighlighting);
editor.addEventListener("keydown", console.log);
editor.addEventListener("input", updateHighlighting);

export { };
