# POS Screen Responsive Layout Plan

## Goal

Make the existing POS screen readable and usable at phone-sized viewports, matching the supplied Stitch reference and avoiding clipped product cards or bill/payment controls.

## Findings

- `mobile/src/app/(app)/sales/index.jsx` currently gives the product `FlatList` a flexible viewport while the cart is a separate panel capped at 55% height. On short viewports, both regions compete for height; the cart also has its own nested scroll area.
- Product, bill, discount, tender, and submit controls therefore do not form one predictable vertical flow. The supplied current screenshot shows product content partly clipped and the bill compressed.
- The existing backend contract, price calculations, validation, authentication, and stock transaction do not need to change for this layout fix.

## Implementation

1. Keep a phone-width content column (`width: 100%`, `maxWidth: 480`) centered in wider browser windows; use the full available width on phones.
2. Make one vertical `FlatList` own the page scroll. Put the title, search, category chips, and section title in its header; render products as a two-column grid; put the entire bill, payment methods, amount entry, and change summary in its footer.
3. Remove nested cart scrolling and height-based panel caps so every cart line remains reachable and never gets clipped by the product browser.
4. Keep a compact total/Complete Sale action visible at the bottom, above the safe area. Preserve the existing save-time validation and disabled state.
5. Keep keyboard avoidance, searchable/category-filtered backend products, real stock limits, and existing localized text/API behavior.

## Acceptance checks

- At a 390 × 844 phone viewport, product cards, cart lines, payment controls, and submit action are legible and reachable by vertical scrolling.
- At a wider browser viewport, the POS stays phone-sized and centered instead of stretching into a desktop form.
- No cart rows, product names/prices, or payment inputs are clipped by competing nested scroll regions.
- Existing API submission, amount/discount validation, stock update, and retry behavior are unchanged.
- Changed mobile files pass focused lint; web export succeeds where available.

## Progress

- [x] Inspect the supplied reference and existing POS layout.
- [x] Replace competing product/cart viewports with one scroll flow and a fixed checkout action.
- [x] Run focused lint and web export; record any verification limitations.

### Verification

- Focused ESLint passed for the POS screen, route, and English/Hindi/Marathi locale files.
- `npx expo export --platform web` completed successfully and bundled the sales route.
- No backend or API behavior changed. Device-level visual testing was not available in this environment.
