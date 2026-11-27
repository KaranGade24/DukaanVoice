import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import {
  cancelAgentAction,
  confirmAgentAction,
  sendAgentMessage,
  updateAgentDraft,
} from "../../services/aiAgentService";
import theme from "../../constants/theme";
import useSpeechInput from "../../hooks/useSpeechInput";
import VoiceDraftEditor from "./VoiceDraftEditor";
import VoiceAssistantMessage from "./VoiceAssistantMessage";
import { calculateBillTotals } from "../pos/billCalculations";

const speechErrorKeys = {
  permission: "home.voiceSpeechPermission",
  service: "home.voiceSpeechServiceUnavailable",
  language: "home.voiceSpeechLanguageUnavailable",
  network: "home.voiceSpeechNetworkError",
  unavailable: "home.voiceSpeechUnavailable",
};

export default function VoiceScreen() {
  const { height } = useWindowDimensions();
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [text, setText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [discountInput, setDiscountInput] = useState("0");
  const [receivedInput, setReceivedInput] = useState("0");
  const speech = useSpeechInput(i18n.resolvedLanguage || i18n.language);

  const send = async () => {
    const input = (speech.transcript || text).trim();
    if (!input || busy || speech.listening) return;
    setText("");
    speech.clear();
    setMessages((items) => [...items, { role: "user", content: input }]);
    setBusy(true);
    try {
      const language = (i18n.resolvedLanguage || i18n.language || "en").split(
        "-",
      )[0];
      const result = await sendAgentMessage(
        token,
        input,
        conversationId,
        undefined,
        ["en", "hi", "mr"].includes(language) ? language : "en",
      );
      setConversationId(result.conversationId);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: result.message,
          toolResults: result.toolResults || [],
        },
      ]);
      setDraft(result.data || null);
      setPending(result.data?.pendingAction || null);
      setDiscountInput(String(result.data?.billingPreview?.discount || 0));
      setReceivedInput(
        String(result.data?.billingPreview?.amountReceived || 0),
      );
    } catch (error) {
      setText(input);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: error.message || t("home.voiceRequestFailed"),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const updateQuantity = (productId, value) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            cart: current.cart.map((line) =>
              String(line.productId) === String(productId)
                ? { ...line, quantity: Math.max(0, Number(value) || 0) }
                : line,
            ),
          }
        : current,
    );

  const saveDraft = async () => {
    if (!conversationId || busy || !draft) return;
    setBusy(true);
    try {
      const result = await updateAgentDraft(token, conversationId, {
        items: draft.cart
          .filter((line) => Number(line.quantity) > 0)
          .map((line) => ({
            productId: String(line.productId),
            quantity: Number(line.quantity),
          })),
        discount: Number(discountInput) || 0,
        paymentMethod: draft.billingPreview?.paymentMethod || "CASH",
        amountReceived:
          (draft.billingPreview?.paymentMethod || "CASH") === "UDHAR"
            ? 0
            : Number(receivedInput) || 0,
        ...(draft.customer?.id ? { customerId: draft.customer.id } : {}),
      });
      setDraft(result.data);
      setPending(result.data?.pendingAction || null);
      setDiscountInput(String(result.data?.billingPreview?.discount || 0));
      setReceivedInput(
        String(result.data?.billingPreview?.amountReceived || 0),
      );
    } catch (error) {
      Alert.alert(
        t("home.voiceError"),
        error.message || t("home.voiceRequestFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const changePayment = async (paymentMethod) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            billingPreview: {
              ...current.billingPreview,
              paymentMethod,
              amountReceived: paymentMethod === "UDHAR" ? 0 : grandTotal,
            },
          }
        : current,
    );
    setReceivedInput(paymentMethod === "UDHAR" ? "0" : grandTotal.toFixed(2));
  };

  const { total: grandTotal } = calculateBillTotals(draft?.cart, discountInput);

  const amountReceived =
    draft?.billingPreview?.paymentMethod === "UDHAR"
      ? 0
      : Math.max(0, Number(receivedInput) || 0);

  const balanceDue =
    draft?.billingPreview?.paymentMethod === "UDHAR"
      ? grandTotal
      : Math.max(0, grandTotal - amountReceived);

  const changeDue =
    draft?.billingPreview?.paymentMethod === "CASH"
      ? Math.max(0, amountReceived - grandTotal)
      : 0;

  const previousTotal = useRef(null);

  useEffect(() => {
    const method = draft?.billingPreview?.paymentMethod || "CASH";
    const oldTotal = previousTotal.current;
    if (oldTotal !== null && oldTotal !== grandTotal && method !== "UDHAR") {
      if (
        method !== "CASH" ||
        Math.round((Number(receivedInput) || 0) * 100) ===
          Math.round(oldTotal * 100)
      )
        setReceivedInput(grandTotal.toFixed(2));
    }
    previousTotal.current = grandTotal;
  }, [grandTotal, draft?.billingPreview?.paymentMethod, receivedInput]);

  const confirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const result = await confirmAgentAction(
        token,
        conversationId,
        pending.confirmationToken,
      );
      setPending(null);
      setDraft(null);
      Alert.alert(
        t("home.voiceSaleComplete"),
        result.sale.saleNumber + " · ₹" + Number(result.sale.total).toFixed(2),
      );
    } catch (error) {
      if (error.status > 0 && error.status < 500) {
        setPending(null);
        setDraft(null);
      }
      Alert.alert(
        t("home.voiceError"),
        error.message || t("home.voiceRequestFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (conversationId)
      await cancelAgentAction(token, conversationId).catch(() => null);
    setPending(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ height: height - 90 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
    >
      <View className="flex-1 bg-background p-4">
        <View className="flex-row items-center gap-3 pb-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-mint">
            <MaterialCommunityIcons
              name="microphone-outline"
              size={25}
              color={theme.colors.primary}
            />
          </View>
          <View>
            <Text className="text-lg font-semibold leading-6 text-text-primary">
              {t("home.voiceScreenTitle")}
            </Text>
            <Text className="mt-0.75 text-sm leading-5 text-text-secondary">
              {t("home.voiceScreenSubtitle")}
            </Text>
          </View>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-4"
          keyboardShouldPersistTaps="handled"
        >
          {!messages.length ? (
            <View className="gap-2.5 rounded-2xl bg-white p-4.5">
              <Text className="text-[15px] leading-5.25 font-semibold text-text-primary">
                {t("home.voiceExamplesTitle")}
              </Text>
              <Text className="mt-0.75 text-sm leading-5 text-text-secondary">
                {t("home.voiceExampleOne")}
              </Text>
              <Text className="mt-0.75 text-sm leading-5 text-text-secondary">
                {t("home.voiceExampleTwo")}
              </Text>
              <Text className="mt-0.75 text-sm leading-5 text-text-secondary">
                {t("home.voiceExampleThree")}
              </Text>
            </View>
          ) : null}
          {messages.map((item, index) => (
            <View
              key={index}
              className={
                item.role === "user"
                  ? "my-1.25 max-w-[90%] self-end rounded-card bg-surface-mint p-3"
                  : "my-1.25 w-full self-start rounded-card border border-border bg-white p-3.5"
              }
            >
              {item.role === "assistant" ? (
                <VoiceAssistantMessage
                  content={item.content}
                  t={t}
                  toolResults={item.toolResults}
                />
              ) : (
                <Text className="text-sm leading-5 text-text-primary">
                  {item.content}
                </Text>
              )}
            </View>
          ))}
          {busy ? <ActivityIndicator color={theme.colors.primary} /> : null}
          <VoiceDraftEditor
            draft={draft}
            pending={pending}
            busy={busy}
            discount={discountInput}
            received={receivedInput}
            total={grandTotal}
            balanceDue={balanceDue}
            changeDue={changeDue}
            t={t}
            onQuantityChange={updateQuantity}
            onDiscountChange={setDiscountInput}
            onReceivedChange={setReceivedInput}
            onPaymentChange={changePayment}
            onSave={saveDraft}
            onConfirm={confirm}
            onCancel={cancel}
          />
        </ScrollView>
        {speech.listening ? (
          <Text className="pt-1.25 text-xs leading-4.25 text-primary">
            {t("home.voiceListening")}
          </Text>
        ) : null}
        {speech.error ? (
          <Text className="pt-1.25 text-xs leading-4.25 text-error">
            {t(speechErrorKeys[speech.error] || speechErrorKeys.unavailable)}
          </Text>
        ) : null}
        <View className="flex-row items-end gap-2 pt-3">
          <TextInput
            value={speech.transcript || text}
            onChangeText={(value) => {
              speech.clear();
              setText(value);
            }}
            placeholder={t("home.voicePlaceholder")}
            className="max-h-30 min-h-12 flex-1 rounded-xl border border-border bg-white p-3 text-text-primary"
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              speech.listening
                ? "home.voiceStopListening"
                : "home.voiceStartListening",
            )}
            onPress={speech.listening ? speech.stop : speech.start}
            disabled={busy}
            className={
              speech.listening
                ? "h-12 w-12 items-center justify-center rounded-xl bg-error"
                : "h-12 w-12 items-center justify-center rounded-xl bg-secondary"
            }
          >
            <MaterialCommunityIcons
              name={speech.listening ? "stop" : "microphone-outline"}
              size={21}
              color="#fff"
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("home.voiceSend")}
            onPress={send}
            disabled={
              busy || speech.listening || !(speech.transcript || text).trim()
            }
            className={
              busy || speech.listening || !(speech.transcript || text).trim()
                ? "h-12 w-12 items-center justify-center rounded-xl bg-primary opacity-45"
                : "h-12 w-12 items-center justify-center rounded-xl bg-primary"
            }
          >
            <MaterialCommunityIcons name="send" size={21} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
