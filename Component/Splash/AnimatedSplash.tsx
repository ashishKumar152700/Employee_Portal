// Component/Splash/AnimatedSplash.tsx
// Takes over from the native splash (same navy background + centred logo),
// plays a short brand reveal, then fades away to show the app underneath.
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";

const LOGO = require("../../assets/logo-mark.png");
const NATIVE_BG = "#002957"; // must match app.json splash backgroundColor
const LOGO_SIZE = 108; // ≈ native splash icon size (imageWidth 240 × 45% logo)
const MIN_VISIBLE_MS = 1700;

export const AnimatedSplash = ({ onFinish }: { onFinish: () => void }) => {
  const [hiddenNative, setHiddenNative] = useState(false);
  const bg = useRef(new Animated.Value(0)).current; // gradient fade-in
  const logo = useRef(new Animated.Value(0)).current; // 0 → 1 settle
  const ring = useRef(new Animated.Value(0)).current; // glow ring pulse
  const text = useRef(new Animated.Value(0)).current; // title reveal
  const sweep = useRef(new Animated.Value(0)).current; // progress shimmer
  const exit = useRef(new Animated.Value(1)).current; // whole overlay

  // Hide the native splash only once this view has painted, so there's no flash.
  const onLayout = async () => {
    if (hiddenNative) return;
    setHiddenNative(true);
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Already hidden (e.g. fast refresh) — nothing to do.
    }
  };

  useEffect(() => {
    if (!hiddenNative) return;
    const ringLoop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      Animated.timing(bg, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(text, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    ringLoop.start();
    sweepLoop.start();

    const timer = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        ringLoop.stop();
        sweepLoop.stop();
        onFinish();
      });
    }, MIN_VISIBLE_MS);

    return () => {
      clearTimeout(timer);
      ringLoop.stop();
      sweepLoop.stop();
    };
  }, [hiddenNative]);

  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents="none"
      style={[styles.root, { opacity: exit }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bg }]}>
        <LinearGradient
          colors={["#00122A", NATIVE_BG, "#0058A8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.decor, styles.decorLg]} />
        <View style={[styles.decor, styles.decorMd]} />
        <View style={[styles.decor, styles.decorSm]} />
      </Animated.View>

      <View style={styles.center}>
        <View style={styles.logoStage}>
          {/* Expanding glow ring */}
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                transform: [
                  { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                ],
              },
            ]}
          />
          <Animated.Image
            source={LOGO}
            style={[
              styles.logo,
              {
                transform: [
                  {
                    scale: Animated.add(
                      logo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
                      exit.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] })
                    ),
                  },
                ],
              },
            ]}
          />
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: text,
            transform: [
              { translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          }}
        >
          <Text style={styles.title}>RKT ESS</Text>
          <Text style={styles.tagline}>Employee Self Service</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottom, { opacity: text }]}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.trackFill,
              {
                transform: [
                  {
                    translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-70, 160] }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "#7DD3FC", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.company}>RishiKirti Technologies</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NATIVE_BG,
    zIndex: 9999,
    elevation: 9999,
  },
  decor: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.12)",
  },
  decorLg: { width: 520, height: 520, top: -220, right: -220 },
  decorMd: { width: 320, height: 320, top: -120, right: -120 },
  decorSm: {
    width: 260,
    height: 260,
    bottom: -110,
    left: -110,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoStage: {
    width: LOGO_SIZE * 1.9,
    height: LOGO_SIZE * 1.9,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: LOGO_SIZE * 1.15,
    height: LOGO_SIZE * 1.15,
    borderRadius: LOGO_SIZE * 0.36,
    borderWidth: 2,
    borderColor: "#7DD3FC",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
    marginTop: 4,
  },
  tagline: {
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 1.2,
    marginTop: 6,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 56,
    alignItems: "center",
  },
  track: {
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    overflow: "hidden",
  },
  trackFill: {
    width: 70,
    height: 3,
  },
  company: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 1.4,
    marginTop: 14,
    textTransform: "uppercase",
  },
});
