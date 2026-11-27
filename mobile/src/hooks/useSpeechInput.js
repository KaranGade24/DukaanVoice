import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Network from "expo-network";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

const speechLocale = (locale) => ({ hi: "hi-IN", mr: "mr-IN", en: "en-IN" }[String(locale || "en").split("-")[0]] || "en-IN");

const getAndroidRecognitionService = () => {
  const services = ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
  const defaultService = ExpoSpeechRecognitionModule.getDefaultRecognitionService()?.packageName;
  const preferredServices = [defaultService, "com.google.android.googlequicksearchbox", ...services];
  return preferredServices.find((service, index) => service && services.includes(service) && preferredServices.indexOf(service) === index) || "";
};

export default function useSpeechInput(locale) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const listeningRef = useRef(false);

  useSpeechRecognitionEvent("start", () => { listeningRef.current = true; setListening(true); });
  useSpeechRecognitionEvent("end", () => { listeningRef.current = false; setListening(false); });
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[event.results.length - 1]?.transcript;
    if (typeof text === "string") setTranscript(text);
  });
  useSpeechRecognitionEvent("error", (event) => {
    listeningRef.current = false;
    setListening(false);
    if (event.error === "aborted") return;
    if (event.error === "not-allowed") setError("permission");
    else if (event.error === "service-not-allowed") setError("service");
    else if (event.error === "language-not-supported") setError("language");
    else if (event.error === "network") setError("network");
    else setError("unavailable");
  });

  const start = useCallback(async () => {
    setError("");
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) { setError("permission"); return false; }
      const networkState = await Network.getNetworkStateAsync().catch(() => ({}));
      const isOnline = networkState.isInternetReachable ?? networkState.isConnected ?? false;
      const recognitionService = Platform.OS === "android" ? getAndroidRecognitionService() : "";
      if ((Platform.OS === "android" && !recognitionService) || !ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setError("service");
        return false;
      }
      setTranscript("");
      ExpoSpeechRecognitionModule.start({
        lang: speechLocale(locale),
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
        ...(Platform.OS !== "web" && { requiresOnDeviceRecognition: !isOnline }),
        ...(recognitionService && { androidRecognitionServicePackage: recognitionService }),
      });
      return true;
    } catch (_error) {
      setError("unavailable");
      return false;
    }
  }, [locale]);

  const stop = useCallback(() => {
    if (listeningRef.current) ExpoSpeechRecognitionModule.stop();
  }, []);
  const clear = useCallback(() => setTranscript(""), []);
  const cancel = useCallback(() => {
    if (listeningRef.current) ExpoSpeechRecognitionModule.abort();
    listeningRef.current = false;
    setListening(false);
    setTranscript("");
  }, []);

  useEffect(() => () => {
    if (listeningRef.current) ExpoSpeechRecognitionModule.abort();
  }, []);

  return { listening, transcript, error, start, stop, cancel, clear };
}
