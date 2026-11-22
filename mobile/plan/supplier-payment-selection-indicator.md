# Supplier Payment Selection Indicator Plan

1. Inspect supplier and purchase row selection handlers and shared theme colors.
2. Make supplier selection toggleable; deselection clears purchase selection, outstanding rows, amount, and idempotency key.
3. Make purchase selection toggleable; deselection clears amount and idempotency key.
4. Replace ambiguous text glyphs with an accessible circular radio indicator aligned at the row end; selected state uses the existing success green.
5. Confirm payment submission requires both a selected supplier and an outstanding purchase, then inspect changes.
