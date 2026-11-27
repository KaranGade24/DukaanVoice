import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const amountFor = (item, majorKey, minorKey) =>
  Number(item?.[majorKey] ?? Number(item?.[minorKey] || 0) / 100);

export const receiptText = (sale, t) => {
  const lines = [
    sale.shop?.name,
    sale.shop?.city,
    "",
    sale.saleNumber,
    new Date(sale.createdAt || Date.now()).toLocaleString(),
  ];

  if (sale.customer?.name)
    lines.push(`${t("pos.customer")}: ${sale.customer.name}`);
  lines.push("------------------------------");

  for (const item of sale.items || [])
    lines.push(
      `${item.productName}\n${item.quantity} ${item.unit} × ${money(amountFor(item, "unitPrice", "unitPriceMinor"))}  ${money(amountFor(item, "lineTotal", "lineTotalMinor"))}`,
    );
  lines.push(
    "------------------------------",
    `${t("pos.subtotal")}: ${money(sale.subtotal)}`,
    `${t("pos.discount")}: -${money(sale.discount)}`,
    `${t("pos.total")}: ${money(sale.total)}`,
    `${t("pos.paymentMethod")}: ${t(`pos.methods.${sale.paymentMethod}`)}`,
    `${t("pos.amountReceived")}: ${money(sale.amountReceived)}`,
  );
  if (Number(sale.balanceDue || 0) > 0)
    lines.push(`${t("pos.balanceDue")}: ${money(sale.balanceDue)}`);
  else lines.push(`${t("pos.change")}: ${money(sale.change)}`);
  return lines.join("\n");
};

export const buildReceiptHtml = (sale, t) => {
  const itemRows = (sale.items || [])
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.productName)}<small>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)} × ${escapeHtml(money(amountFor(item, "unitPrice", "unitPriceMinor")))}</small></td><td>${escapeHtml(money(amountFor(item, "lineTotal", "lineTotalMinor")))}</td></tr>`,
    )
    .join("");
  const paid =
    Number(sale.balanceDue || 0) > 0
      ? `<div class="row"><span>${escapeHtml(t("pos.balanceDue"))}</span><strong>${escapeHtml(money(sale.balanceDue))}</strong></div>`
      : `<div class="row"><span>${escapeHtml(t("pos.change"))}</span><strong>${escapeHtml(money(sale.change))}</strong></div>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#202b25;padding:24px;max-width:440px;margin:auto}header{text-align:center;border-bottom:1px dashed #96a19a;padding-bottom:16px;margin-bottom:16px}h1{font-size:21px;margin:0 0 4px;color:#047857}p{margin:3px 0;color:#66736b;font-size:12px}.ref{font-size:15px;color:#202b25;font-weight:700;margin:8px 0}table{width:100%;border-collapse:collapse}td{padding:9px 0;border-bottom:1px solid #e5eae6;font-size:13px}td:last-child{text-align:right;font-weight:600}small{display:block;color:#66736b;margin-top:3px}.totals{padding-top:10px}.row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}.grand{border-top:1px solid #becabd;margin-top:5px;padding-top:10px;font-size:16px;color:#047857;font-weight:700}.foot{text-align:center;border-top:1px dashed #96a19a;margin-top:18px;padding-top:13px}</style></head><body><header><h1>${escapeHtml(sale.shop?.name || "")}</h1><p>${escapeHtml(sale.shop?.city || "")}</p><div class="ref">${escapeHtml(sale.saleNumber || "")}</div><p>${escapeHtml(new Date(sale.createdAt || Date.now()).toLocaleString())}</p>${sale.customer?.name ? `<p>${escapeHtml(t("pos.customer"))}: ${escapeHtml(sale.customer.name)}${sale.customer.phone ? ` · ${escapeHtml(sale.customer.phone)}` : ""}</p>` : `<p>${escapeHtml(t("pos.walkIn"))}</p>`}</header><table>${itemRows}</table><section class="totals"><div class="row"><span>${escapeHtml(t("pos.subtotal"))}</span><span>${escapeHtml(money(sale.subtotal))}</span></div><div class="row"><span>${escapeHtml(t("pos.discount"))}</span><span>−${escapeHtml(money(sale.discount))}</span></div><div class="row grand"><span>${escapeHtml(t("pos.total"))}</span><span>${escapeHtml(money(sale.total))}</span></div><div class="row"><span>${escapeHtml(t("pos.paymentMethod"))}</span><span>${escapeHtml(t(`pos.methods.${sale.paymentMethod}`))}</span></div><div class="row"><span>${escapeHtml(t("pos.amountReceived"))}</span><span>${escapeHtml(money(sale.amountReceived))}</span></div>${paid}</section><footer class="foot"><p>${escapeHtml(sale.shop?.name || "")}</p></footer></body></html>`;
};

export const printReceipt = (sale, t) =>
  Print.printAsync({ html: buildReceiptHtml(sale, t) });
export const shareReceiptPdf = async (sale, t) => {
  const text = receiptText(sale, t);
  if (Platform.OS === "web") return Share.share({ message: text });
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(t("pos.sharingUnavailable"));
  const file = await Print.printToFileAsync({
    html: buildReceiptHtml(sale, t),
    base64: false,
  });
  return Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle: t("pos.shareReceipt"),
  });
};
