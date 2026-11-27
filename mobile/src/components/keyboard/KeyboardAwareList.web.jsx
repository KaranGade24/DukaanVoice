import { FlatList } from "react-native";

export default function KeyboardAwareList(props) {
  const forwardedProps = Object.fromEntries(
    Object.entries(props).filter(
      ([key]) =>
        !["enableOnAndroid", "enableAutomaticScroll", "extraScrollHeight"].includes(key),
    ),
  );
  return <FlatList {...forwardedProps} />;
}
