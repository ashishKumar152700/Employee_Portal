import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");
const scaleFont = (size: number) => Math.round(size * (width / 375));
const scaleSize = (size: number) => Math.round(size * (width / 375));

const PRIMARY = "rgb(0,47,81)";

const PunchScreenComingSoon = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/underConstruction.json")}
        autoPlay
        loop
         style={{ width: 320, height: 320 }}
      />

      <Text style={styles.title}>Punch Feature Coming Soon!</Text>

      <Text style={styles.infoText}>
        Punch In / Punch Out will be available soon.
      </Text>

      <Text style={styles.secondaryText}>
        Meanwhile, you can view your attendance & punch history in the{" "}
        <Text style={styles.highlight}>Calendar</Text> tab below.
      </Text>

      <Text style={styles.footerNote}>Thank you for your patience </Text>
    </View>
  );
};

export default PunchScreenComingSoon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
    justifyContent: "center",
    alignItems: "center",
    padding: scaleSize(20),
    marginBottom : scaleSize(60),
  },
  animation: {
    width: scaleSize(220),
    height: scaleSize(220),
    marginBottom: scaleSize(10),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  infoText: {
    fontSize: scaleFont(14),
    color: PRIMARY,
    marginBottom: scaleSize(10),
    textAlign: "center",
     fontWeight: "700",
  },
  secondaryText: {
    fontSize: scaleFont(12),
    color: "#555",
    textAlign: "center",
    paddingHorizontal: scaleSize(20),
    lineHeight: scaleFont(20),
  },
  highlight: {
    color: PRIMARY,
    fontWeight: "700",
  },
  footerNote: {
    marginTop: scaleSize(25),
    fontSize: scaleFont(13),
    color: "#777",
     fontWeight: "700",
  },
});
