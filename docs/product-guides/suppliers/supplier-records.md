# Supplier records

[Supplier management overview](README.md) · [All tab guides](../README.md)

## Find a supplier

Open **More → Suppliers**. Search by supplier name, contact person, phone number, or business name. Choose **Active**, **Archived**, or **All** to change which records appear. Results load 20 at a time; use **Load more** for the next page. Pull down to refresh.

Each row shows the supplier name, phone, optional business name, active/archive status, and outstanding balance. Tap a row to see details.

## Add a supplier

1. Tap the **＋** button on the Suppliers screen.
2. Enter a supplier name and phone number. These are required.
3. Add other details if available: contact person, alternate phone, email, business name, GSTIN, address, and notes.
   **Contact person** is the name of the person you usually speak to at the supplier’s business.
4. Tap **Save supplier**.

Phone numbers can contain a leading plus sign, spaces, parentheses, and hyphens; enter at least seven digits. The app uses phone, email, uppercase GSTIN, and numeric PIN keyboards or formatting where appropriate. The backend validates the final values, so read any field-level message and correct the highlighted field.

### Example

For a supplier called **Kaveri Foods**, enter the supplier’s business phone and optionally add a contact person and email. If you know its GSTIN, enter the 15-character identifier; the form uppercases it before saving.

## Possible duplicate warning

The backend looks for a supplier with the same normalized phone number or matching business name in your shop. If it finds one, the save can still complete and the app shows a **Possible duplicate** warning. Review the existing record before continuing; the warning does not automatically merge or replace either supplier.

## Edit a supplier

Open a supplier and tap **Edit supplier**. Update the contact details and save. Server validation messages appear on the relevant fields. If a save fails because of a network or server error, the form stays open so you can retry.

## Archive a supplier

Open an active supplier, tap **Archive supplier**, and confirm. Archive keeps the supplier and its purchase/payment history. Archived suppliers are not valid for new purchases; the backend enforces this rule. The supplier can still be viewed and appears under the Archived or All filter.

## Fix common save problems

- **Phone number:** check for at least seven digits and remove letters or unsupported symbols.
- **Email:** leave it blank if not known, or check for a valid email format.
- **GSTIN:** check the 15-character GSTIN format. The server is authoritative and may reject a malformed value.
- **Required fields:** supplier name and primary phone cannot be blank.
- **Network error:** retry when the connection is available. Check the supplier list before repeating a save if you are unsure whether it completed.
