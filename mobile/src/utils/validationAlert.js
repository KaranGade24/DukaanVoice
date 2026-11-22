import { Alert } from "react-native";

export function showValidationAlert(error, title = "Validation error") {
  if (error?.code !== "VALIDATION_ERROR") return false;

  Alert.alert(title, error.message || "Please check the highlighted fields.");
  return true;
}
