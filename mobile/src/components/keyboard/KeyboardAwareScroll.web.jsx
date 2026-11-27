import { ScrollView } from "react-native";

export default function KeyboardAwareScroll(props) {
  const forwardedProps = Object.fromEntries(
    Object.entries(props).filter(
      ([key]) =>
        !["enableOnAndroid", "enableAutomaticScroll", "extraScrollHeight"].includes(key),
    ),
  );
  return <ScrollView {...forwardedProps} />;
}
