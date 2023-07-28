
# Wort

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

### Found browser incompatibilities:
- client rect handling of ranges near forced line break
- range creation & client rect handling with offsets in whitespace before/after first/last text
- client rect handling of ranges with multiple collapsed whitespace
- what happens when caret is moved up/down to a shorter line with forced line break
- Firefox bug where left/right arrow keys at forced line break don't do anything once
- where does the caret jump to when clicking under/over/between text elements
- where does the page scroll to when you start typing while the caret is focused on on area not currently visible
- whether or not and when do selectionchange events get dispatched when deleting letters/words/etc with Backspace/Del
