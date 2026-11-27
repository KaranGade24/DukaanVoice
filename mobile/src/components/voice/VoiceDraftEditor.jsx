import { Pressable, Text, TextInput, View } from "react-native";
import BillLineItem from "../pos/BillLineItem";
import PaymentMethodSelector from "../pos/PaymentMethodSelector";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function VoiceDraftEditor({
  draft,
  pending,
  busy,
  discount,
  received,
  total,
  balanceDue,
  changeDue,
  t,
  onQuantityChange,
  onDiscountChange,
  onReceivedChange,
  onPaymentChange,
  onSave,
  onConfirm,
  onCancel,
}) {
  if (!draft?.cart?.length) return null;

  const paymentMethod = draft.billingPreview?.paymentMethod || "CASH";
  const receivedDisabled = busy || paymentMethod === "UDHAR";

  return (
    <View className="voice-confirmation-card">
      <Text className="voice-draft-title">{t("home.voiceReviewBill")}</Text>
      <Text className="voice-draft-note">
        {draft.customer?.name
          ? `${t("pos.customer")}: ${draft.customer.name}`
          : t("pos.walkIn")}
      </Text>

      {draft.cart.map((line) => (
        <BillLineItem
          key={String(line.productId)}
          product={{
            ...line,
            id: String(line.productId),
            quantity: line.stock,
          }}
          quantity={line.quantity}
          subtotal={Number(line.sellingPrice) * Number(line.quantity)}
          onQuantityChange={(value) => onQuantityChange(line.productId, value)}
          t={t}
        />
      ))}

      <View className="voice-draft-row">
        <Text className="voice-draft-note">{t("pos.subtotal")}</Text>
        <Text className="voice-draft-note">
          {money(
            draft.cart.reduce(
              (sum, line) =>
                sum + Number(line.sellingPrice) * Number(line.quantity),
              0,
            ),
          )}
        </Text>
      </View>

      <View className="voice-draft-row">
        <Text className="voice-draft-note">{t("pos.discount")}</Text>
        <TextInput
          value={discount}
          onChangeText={onDiscountChange}
          selectTextOnFocus
          keyboardType="decimal-pad"
          editable={!busy}
          className={`voice-draft-input ${busy ? "opacity-50" : ""}`}
        />
      </View>

      <View className="voice-draft-row">
        <Text className="voice-draft-title">{t("pos.total")}</Text>
        <Text className="voice-draft-title">{money(total)}</Text>
      </View>

      <Text className="voice-draft-note">{t("pos.paymentMethod")}</Text>
      <PaymentMethodSelector
        value={paymentMethod}
        onChange={onPaymentChange}
        t={t}
        disabled={busy}
      />

      <Text className="voice-draft-note">{t("pos.amountReceived")}</Text>
      <TextInput
        value={received}
        onChangeText={onReceivedChange}
        selectTextOnFocus
        keyboardType="decimal-pad"
        editable={!receivedDisabled}
        className={`voice-draft-input ${receivedDisabled ? "opacity-50" : ""}`}
      />

      <Text className="voice-draft-note">
        {balanceDue > 0 ? t("pos.balanceDue") : t("pos.change")}:{" "}
        {money(balanceDue > 0 ? balanceDue : changeDue)}
      </Text>
      <Text className="voice-draft-note">
        {pending ? t("home.voiceConfirmHint") : t("home.voicePaymentRequired")}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        onPress={onSave}
        disabled={busy}
        className={`btn-primary ${busy ? "opacity-50" : ""}`}
      >
        <Text className="text-label-md font-bold text-on-primary">
          {t("home.voiceSaveDraft")}
        </Text>
      </Pressable>

      {pending ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={onConfirm}
            disabled={busy}
            className={`btn-primary ${busy ? "opacity-50" : ""}`}
          >
            <Text className="text-label-md font-bold text-on-primary">
              {t("home.voiceConfirm")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={onCancel}
            disabled={busy}
          >
            <Text className={`voice-draft-cancel ${busy ? "opacity-50" : ""}`}>
              {t("home.voiceCancel")}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
