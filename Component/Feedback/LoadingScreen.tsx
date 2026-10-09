// Component/Feedback/LoadingScreen.tsx
// Full-area branded loader used while a screen fetches its first data.
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { themedStyles } from "../../Global/ThemeContext";

const LOGO = require("../../assets/logo-mark.png");
const LOADING = require("../../assets/animations/loading.json");

export const LoadingScreen = ({
  message = "Loading...",
  submessage,
  showLogo = true,
}: {
  message?: string;
  submessage?: string;
  showLogo?: boolean;
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      {showLogo ? (
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.halo,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }),
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) },
                ],
              },
            ]}
          />
          <Image source={LOGO} style={styles.logo} />
        </View>
      ) : null}
      <LottieView source={LOADING} autoPlay loop style={styles.lottie} />
      <Text style={styles.message}>{message}</Text>
      {!!submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </Animated.View>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
    paddingHorizontal: 32,
  },
  logoStage: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  halo: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 40,
    backgroundColor: c.primaryFaint,
    borderWidth: 1,
    borderColor: c.border,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 18,
  },
  lottie: {
    width: 120,
    height: 60,
  },
  message: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    textAlign: "center",
  },
  submessage: {
    fontSize: 13,
    color: c.textSoft,
    marginTop: 4,
    textAlign: "center",
  },
}));
