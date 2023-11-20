
if (!Intl.Segmenter) {
	Object.defineProperty(Intl, "Segmenter", {
		value: class Segmenter {
			#granularity = /** @type {Intl.SegmenterOptions["granularity"]} */ (undefined);
			constructor(/** @type {string | string[]} */ locales, /** @type {Intl.SegmenterOptions} */ { granularity = "grapheme" }) {
				if (granularity !== "word") throw new Error("TODO: implement grapheme & sentence segmentation");
				this.#granularity = granularity;
			};
			segment(/** @type {string} */ input) {
				return {
					[Symbol.iterator]: function* () {
						let currentString = "";
						let isWord = false;
						for (const [index, char] of [...input].entries()) {
							let charIsWord = /^[\w'_]$/.test(char);
							if (charIsWord !== isWord && currentString) {
								yield {
									segment: currentString,
									isWordLike: isWord,
									index,
									input,
								};
								currentString = "";
							}
							isWord = charIsWord;
							currentString += char;
						}
					},
				};
			}
		},
	});
}

export { };
