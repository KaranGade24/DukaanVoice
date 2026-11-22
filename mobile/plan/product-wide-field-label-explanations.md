# Product-Wide Field Label Explanations Plan

## Goal
Make every user-facing mobile form field understandable in context. Feature documentation will explain the purpose of fields, especially business terms and optional references; mobile placeholders or helper text will give a concise example where it improves data entry.

## Steps
1. Inventory all mobile screens and form fields by feature/tab, including auth, inventory, suppliers, purchases, payments, sales, khata, and settings where present.
2. Read existing feature guides and identify terms that a shop user may not understand, fields whose purpose is not obvious, and fields that need examples.
3. Create/update the relevant feature guide for each feature, documenting every field’s purpose, whether it is required/optional, accepted format, and a short example where useful. Avoid duplicating API implementation details in user guides.
4. Add concise localized placeholders or inline helper text to unclear mobile form inputs, preserving existing validation and payload contracts. Never put long instructions in placeholders.
5. Keep translations consistent in English, Hindi, and Marathi and avoid changing backend semantics solely for copy updates.
6. Review guide navigation, field coverage, accessibility labels, and changed files; run relevant static checks and record remaining gaps.

## Acceptance criteria
- Each shipped mobile feature with forms has a user-facing guide linked from its feature documentation index.
- Guide entries explain field purpose and required/optional status, and give examples for identifiers, dates, amounts, and domain terms as relevant.
- Unclear fields have localized concise on-screen examples or helper explanations.
- Existing API field names and business behavior remain unchanged unless a separately scoped feature requires it.

## Execution approach
Complete one feature/tab at a time: inventory its screens and backend contract, update that feature’s guide, then update matching mobile labels/placeholders, then review before moving to the next feature. Track progress in this plan.

## Progress
- [x] Plan and audit approach established.
- [x] Supplier payments: transaction-reference purpose, optionality, and examples documented; concise localized helper and placeholder added.
- [ ] Inventory and document remaining form features, one feature at a time.
