
# Wort

[Work in progress!] The goal of this project is to build a rich text editor Microsoft-Word-alternative.

[benjaminaster.com/wort](https://benjaminaster.com/wort/)

### Naming ideas:

- Wort
- Writer
- Wipalu (Word is proprietary and LibreOffice ugly)
- Wipaliu (Word is proprietary and LibreOffice is ugly)
- Livu (LibreOffice is very ugly)
- Winaol (Word is not available on Linux)
- Waflin (Word alternative for Linux-iterested nerds)
- Oswa (open-source Word alternative)
- Lituimo (LibreOffice is too ugly in my opinion)
- Watwol (Word alternative that works on Linux)
- Wariab (Word alternative running in a browser)

### Browser incompatibilities:

#### Selection, ranges & linebreaks
- client rect handling of ranges near automatic break
- range creation & client rect handling with offsets in whitespace before/after first/last text
- client rect handling of ranges with multiple collapsed whitespace
- what happens when caret is moved up/down to a shorter line with automatic break
- Firefox bug where left/right arrow keys at automatic line break don't do anything once
- where does the caret jump to when clicking under/over/between text elements
- where does the page scroll to when you start typing while the caret is focused on on area not currently visible
- whether or not and when selectionchange events get dispatched when deleting letters/words/etc with Backspace/Del
- wrapped spans with underline: does underline expand across the line's last (broken) space
- WebKit weirdness where the automatic-line-break-space gets its own client rect
- range client rect handling when span-like element is directly before/after automatic line break

#### SVG
- context2d.drawImage() with SVG without width/height attributes (only viewBox)
- SVG in context2d.drawImage(): does @media (prefers-color-scheme) get respected
- &lt;img&gt; with SVG src: does @media (prefers-color-scheme) get respected

#### DOM parsing & serialization
- invalid XML fed to DOMParser: where does &lt;parsererror&gt; appear in the tree
- does xmlns attribute get preserved with XMLSerializer

#### Pointer & touch events
- pointermove & mousemove events with touch

#### CSS
- exact border colors with border-style: groove/ridge/inset/outset

#### Files & directories
- does inputElement.webkitEntries get populated with &lt;input type=file webkitdirectory&gt;
