import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { punchService } from "../../Services/Punch/Punch.service";
import { useDispatch, useSelector } from "react-redux";
import ClockComponent from "./ClockComponent";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";
import { RefreshControl } from "react-native";
import LottieView from "lottie-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { AppDialog } from "../../Component/Feedback/AppDialog";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import { themedStyles, C } from "../../Global/ThemeContext";

const { width } = Dimensions.get("window");
const scaleFont = (size: any) => Math.round(size * (width / 375));
const scaleSize = (size: any) => Math.round(size * (width / 375));

const PAGE_BG = "#F4F7FB";
const NEON = "#7DD3FC";
const ORB_SIZE = Math.min(Math.round((width - 32 - 16) / 2) - 6, 172);
const IN_GRADIENT = ["#00295A", "#0066C2"] as const;
const OUT_GRADIENT = ["#33196E", "#7C3AED"] as const;
const DISABLED_GRADIENT = ["#8B97AA", "#C3CBD7"] as const;

// ─── Lottie animation sources ─────────────────────────────────────────────────
const LOTTIE = {
  locating: require("../../assets/animations/location-pulse.json"),
  processing: require("../../assets/animations/punch-processing.json"),
  success: require("../../assets/animations/punch-success.json"),
  error: require("../../assets/animations/punch-error.json"),
};

// ─── Punch phase types ────────────────────────────────────────────────────────
type PunchPhase = "locating" | "processing" | "success" | "error" | null;

interface PhaseConfig {
  label: string;
  sublabel: string;
  animColor: string;
  bgAccent: string;
}

// A function (not a constant) so colours follow the active light / dark theme.
const getPhaseConfig = (): Record<NonNullable<PunchPhase>, PhaseConfig> => ({
  locating: {
    label: "Getting your location",
    sublabel: "Please stay still for a moment…",
    animColor: C.link,
    bgAccent: C.primaryFaint,
  },
  processing: {
    label: "Recording punch",
    sublabel: "Sending to server…",
    animColor: C.accent,
    bgAccent: C.primaryFaint,
  },
  success: {
    label: "Punch recorded!",
    sublabel: "Your attendance is saved",
    animColor: C.successText,
    bgAccent: C.successBg,
  },
  error: {
    label: "Something went wrong",
    sublabel: "Please try again",
    animColor: C.dangerText,
    bgAccent: C.dangerBg,
  },
});

// Parses the "HH:mm:ss"-style times the API returns (same approach the
// duration fallback uses). Returns null for anything unparseable.
const parseTimeOfDay = (time?: string | null): Date | null => {
  if (!time) return null;
  const parsed = new Date(`1970-01-01T${time}`);
  if (isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(parsed.getHours(), parsed.getMinutes(), parsed.getSeconds(), 0);
  return today;
};

const pad = (n: number) => String(n).padStart(2, "0");

// ─── PunchOverlay component ───────────────────────────────────────────────────
interface PunchOverlayProps {
  phase: PunchPhase;
  punchType: "in" | "out" | null;
}

const PunchOverlay: React.FC<PunchOverlayProps> = ({ phase, punchType }) => {
  // Keep the last phase while the dialog animates out.
  const lastPhase = useRef<NonNullable<PunchPhase>>("locating");
  if (phase) lastPhase.current = phase;
  const shown = lastPhase.current;
  const config = getPhaseConfig()[shown];
  const actionLabel = punchType === "in" ? "Clock In" : "Clock Out";
  const steps: NonNullable<PunchPhase>[] = ["locating", "processing", "success"];
  const activeIndex = shown === "error" ? -1 : steps.indexOf(shown);
  const isActive = shown === "locating" || shown === "processing";

  return (
    <AppDialog
      visible={!!phase}
      variant={isActive ? "loading" : shown === "success" ? "success" : "error"}
      lottie={LOTTIE[shown]}
      loop={isActive}
      title={config.label}
      message={config.sublabel}
      hideActions
      dismissible={false}
    >
      <View style={[styles.overlayPhaseRow, { borderColor: C.borderStrong }]}>
        <View style={[styles.overlayPhaseDot, { backgroundColor: config.animColor }]} />
        <Text style={[styles.overlayPhaseLabel, { color: config.animColor }]}>
          {actionLabel}
        </Text>
      </View>

      {/* Step progress: locate → record → done */}
      {shown !== "error" && (
        <View style={styles.dotsRow}>
          {steps.map((step, index) => (
            <View
              key={step}
              style={[
                styles.dot,
                index < activeIndex && styles.dotDone,
                index === activeIndex && [styles.dotActive, { backgroundColor: config.animColor }],
              ]}
            />
          ))}
        </View>
      )}
    </AppDialog>
  );
};

// ─── Map loading state ─────────────────────────────────────────────────────
const MapLoading = () => (
  <View style={styles.mapLoading}>
    <LottieView source={LOTTIE.locating} autoPlay loop style={styles.mapLoadingLottie} />
    <Text style={styles.mapLoadingTitle}>Loading map</Text>
    <Text style={styles.mapLoadingText}>Pinpointing your punch location…</Text>
  </View>
);

// ─── Pulse rings behind the suggested action ─────────────────────────────────
const PulseRings = ({ color, size }: { color: string; size: number }) => {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const first = loop(a, 0);
    const second = loop(b, 1100);
    first.start();
    second.start();
    return () => {
      first.stop();
      second.stop();
    };
  }, []);

  const ring = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    transform: [
      { scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.32] }) },
    ],
  });

  const base = {
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
  };

  return (
    <>
      <Animated.View pointerEvents="none" style={[base, ring(a)]} />
      <Animated.View pointerEvents="none" style={[base, ring(b)]} />
    </>
  );
};

// ─── ClockButton ──────────────────────────────────────────────────────────────
interface ClockButtonProps {
  time: string;
  date: string;
  type: "in" | "out";
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
  highlight?: boolean;
  caption?: string;
}

const ClockButton: React.FC<ClockButtonProps> = ({
  type,
  onPress,
  isLoading,
  disabled = false,
  highlight = false,
  caption,
}) => {
  const press = useRef(new Animated.Value(1)).current;
  const gradientColors = disabled
    ? DISABLED_GRADIENT
    : type === "in"
      ? IN_GRADIENT
      : OUT_GRADIENT;

  const handlePress = () => {
    if (isLoading) return;
    if (disabled && type === "in") {
      Toast.show({
        type: "info",
        position: "top",
        text1: "Already Punched In",
        text2: "You have already punched in.",
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    onPress();
  };

  const springTo = (value: number) =>
    Animated.spring(press, {
      toValue: value,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();

  return (
    <View style={styles.orbColumn}>
      <View style={styles.orbStage}>
        {highlight && !disabled && !isLoading && (
          <PulseRings color={gradientColors[1]} size={ORB_SIZE} />
        )}
        <Animated.View style={{ transform: [{ scale: press }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            onPressIn={() => springTo(0.94)}
            onPressOut={() => springTo(1)}
            accessibilityRole="button"
            accessibilityLabel={type === "in" ? "Clock in" : "Clock out"}
            style={[
              styles.orbShadow,
              { shadowColor: gradientColors[1] },
              disabled && styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orb}
            >
              {/* Inner ring + sheen give the orb its depth */}
              <View style={styles.orbInnerRing} />
              <View style={styles.orbSheen} />
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={disabled ? "check-decagram" : "fingerprint"}
                    size={scaleSize(46)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>
                    {type === "in" ? "CLOCK IN" : "CLOCK OUT"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
      {!!caption && (
        <Text style={styles.orbCaption} numberOfLines={1}>
          {caption}
        </Text>
      )}
    </View>
  );
};

// ─── Live on-duty timer (own interval, so only this text re-renders) ─────────
const OnDutyTimer = ({ clockInTime }: { clockInTime: string }) => {
  const start = parseTimeOfDay(clockInTime);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!start) return null;
  const elapsed = Math.max(0, Math.floor((now - start.getTime()) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <View style={styles.timerRow}>
      <MaterialCommunityIcons name="timer-outline" size={15} color={NEON} />
      <Text style={styles.timerLabel}>On duty</Text>
      <Text style={styles.timerValue}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </Text>
    </View>
  );
};

// ─── PunchScreen ──────────────────────────────────────────────────────────────
const PunchScreen: React.FC = () => {
  const { contentPaddingBottom } = useTabBarClearance();
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState<string | null>(null);
  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);
  const [todayPunch, setTodayPunch] = useState<any>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [punchType, setPunchType] = useState<"in" | "out" | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✦ Lottie overlay phase
  const [punchPhase, setPunchPhase] = useState<PunchPhase>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    fetchTodayPunch();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTodayPunch();
    setRefreshing(false);
  }, []);

  const fetchTodayPunch = async () => {
    try {
      const punch = await punchService.GetTodayPunchAndUpdateRedux(dispatch);
      setTodayPunch(punch);
      if (punch) {
        setClockInTime(punch.punchintime);
        setClockOutTime(punch.punchouttime);
        if (punch.duration != null) {
          setTotalTime(
            `${Math.floor(punch.duration / 60)}h ${punch.duration % 60}m`,
          );
        } else if (punch.punchintime && punch.punchouttime) {
          const diff = Math.round(
            (new Date(`1970-01-01T${punch.punchouttime}`).getTime() -
              new Date(`1970-01-01T${punch.punchintime}`).getTime()) /
              60000,
          );
          setTotalTime(`${Math.floor(diff / 60)}h ${diff % 60}m`);
        } else {
          setTotalTime("0h 0m");
        }
      } else {
        setClockInTime(null);
        setClockOutTime(null);
        setTotalTime(null);
      }
    } catch {
      setTodayPunch(null);
      setClockInTime(null);
      setClockOutTime(null);
      setTotalTime(null);
    }
  };

  // ─── Location helpers ───────────────────────────────────────────────────────
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Location Disabled",
        text2: "Please enable location services to proceed.",
        visibilityTime: 3000,
        autoHide: true,
      });
      return false;
    }
    return true;
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      const addr = res[0]?.formattedAddress || `${lat}, ${lng}`;
      setAddress(addr);
      return addr;
    } catch {
      const fallback = `${lat}, ${lng}`;
      setAddress(fallback);
      return fallback;
    }
  };

  const getLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) return undefined;
    try {
      const locResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = locResult.coords;
      setLocation({ latitude, longitude });
      const resolvedAddress = await getAddressFromCoordinates(
        latitude,
        longitude,
      );
      return { location: locResult, address: resolvedAddress };
    } catch {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Location Error",
        text2: "Unable to fetch location. Please check GPS settings.",
        visibilityTime: 3000,
        autoHide: true,
      });
      return undefined;
    }
  };

  // ─── Helper: show success/error briefly then run callback ──────────────────
  const finishWithPhase = (
    finalPhase: "success" | "error",
    delay: number,
    callback: () => void,
  ) => {
    setPunchPhase(finalPhase);
    setTimeout(() => {
      setPunchPhase(null);
      callback();
    }, delay);
  };

  // ─── Clock In ───────────────────────────────────────────────────────────────
  const isClockInDisabled = todayPunch && todayPunch.punchintime;

  const handleClockIn = async () => {
    const latestPunch = await punchService.GetTodayPunchApi();
    if (latestPunch?.punchintime && !latestPunch?.punchouttime) {
      Toast.show({
        type: "info",
        text1: "Already Punched In",
        text2: "You have already punched in today. You can punch out.",
      });
      return;
    }

    setIsClockInLoading(true);
    setPunchType("in");

    try {
      // Phase 1 — locating
      setPunchPhase("locating");
      const result = await getLocation();
      if (!result?.location?.coords) {
        finishWithPhase("error", 1800, () => {});
        return;
      }

      // Phase 2 — processing
      const { location: loc, address: resolvedAddress } = result;
      setPunchPhase("processing");
      const response = await punchService.PunchInApi(loc, resolvedAddress);

      const newPunchTime =
        response.data?.punchintime || new Date().toLocaleTimeString();
      setClockInTime(newPunchTime);
      setTodayPunch((prev: any) => ({
        ...(prev || {}),
        punchintime: newPunchTime,
        punchouttime: null,
      }));

      // Phase 3 — success → open map
      finishWithPhase("success", 1400, () => {
        setIsMapVisible(true);
        Toast.show({
          type: "success",
          position: "top",
          text1: "Punched In",
          text2: response.message || "Punch recorded successfully",
          visibilityTime: 3000,
          autoHide: true,
        });
      });
    } catch {
      finishWithPhase("error", 1800, () => {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: "An error occurred while punching in.",
          visibilityTime: 3000,
          autoHide: true,
        });
      });
    } finally {
      setIsClockInLoading(false);
    }
  };

  // ─── Clock Out ──────────────────────────────────────────────────────────────
  const handleClockOut = async () => {
    const latestPunch = await punchService.GetTodayPunchApi();
    if (!latestPunch?.punchintime) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please punch in first",
      });
      return;
    }

    setIsClockOutLoading(true);
    setPunchType("out");

    try {
      // Phase 1 — locating
      setPunchPhase("locating");
      const result = await getLocation();
      if (!result?.location?.coords) {
        finishWithPhase("error", 1800, () => {});
        return;
      }

      // Phase 2 — processing
      const { location: loc, address: resolvedAddress } = result;
      setPunchPhase("processing");
      const response = await punchService.PunchOutApi(loc, resolvedAddress);

      const newPunchOutTime =
        response.data?.punchouttime || new Date().toLocaleTimeString();
      setClockOutTime(newPunchOutTime);

      let duration = response.data?.duration;
      if (duration == null && clockInTime) {
        duration = Math.round(
          (new Date(`1970-01-01T${newPunchOutTime}`).getTime() -
            new Date(`1970-01-01T${clockInTime}`).getTime()) /
            60000,
        );
      }
      if (duration != null) {
        setTotalTime(`${Math.floor(duration / 60)}h ${duration % 60}m`);
      }

      setTodayPunch((prev: any) => ({
        ...(prev || {}),
        punchouttime: newPunchOutTime,
        duration: duration ?? prev?.duration,
      }));
      await fetchTodayPunch();

      // Phase 3 — success → open map
      finishWithPhase("success", 1400, () => {
        setIsMapVisible(true);
        Toast.show({
          type: "success",
          position: "top",
          text1: "Punched Out",
          text2: response.message || "Punch recorded successfully",
          visibilityTime: 3000,
          autoHide: true,
        });
      });
    } catch {
      finishWithPhase("error", 1800, () => {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: "An error occurred while punching out.",
          visibilityTime: 3000,
          autoHide: true,
        });
      });
    } finally {
      setIsClockOutLoading(false);
    }
  };

  // ─── Map HTML ───────────────────────────────────────────────────────────────
  const generateMapHTML = (latitude: number, longitude: number) => `
    <!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"/>
    <style>#map{height:100%;width:100%}body,html{height:100%;margin:0;padding:0}</style>
    </head><body><div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded",function(){
        var map=L.map('map').setView([${latitude},${longitude}],16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
          attribution:'&copy; OpenStreetMap contributors'
        }).addTo(map);
        L.marker([${latitude},${longitude}]).addTo(map)
          .bindPopup("Your Punch Location").openPopup();
      });
    </script></body></html>`;

  // ─── Derived display state (UI only) ────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const hasClockIn = !!clockInTime;
  const hasClockOut = !!clockOutTime;
  const nextAction: "in" | "out" | null = !hasClockIn
    ? "in"
    : !hasClockOut
      ? "out"
      : null;
  const status = !hasClockIn
    ? { label: "Not clocked in", color: "#FBBF24", icon: "clock-alert-outline" }
    : !hasClockOut
      ? { label: "On duty", color: "#34D399", icon: "radar" }
      : { label: "Shift complete", color: NEON, icon: "check-circle-outline" };

  const closeMap = () => {
    setIsMapVisible(false);
    setLocation(null);
    setAddress("");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: contentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.accent]}
            tintColor={C.accent}
          />
        }
      >
        {/* ── Command center ─────────────────────────────────────────── */}
        <LinearGradient
          colors={C.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.heroRing, styles.heroRingLg]} />
            <View style={[styles.heroRing, styles.heroRingMd]} />
            <View style={[styles.heroRing, styles.heroRingSm]} />
            <View style={styles.heroScanLine} />
          </View>

          <View style={styles.heroTop}>
            <View style={styles.heroBrand}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={NEON} />
              <Text style={styles.heroBrandText}>ATTENDANCE</Text>
            </View>
            <GlassSurface tone="dark" radius={999} style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={styles.statusText}>{status.label}</Text>
            </GlassSurface>
          </View>

          <View style={styles.clockWrap}>
            <ClockComponent />
          </View>

          {hasClockIn && !hasClockOut ? (
            <OnDutyTimer clockInTime={clockInTime as string} />
          ) : hasClockOut ? (
            <View style={styles.timerRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color={NEON} />
              <Text style={styles.timerLabel}>Worked today</Text>
              <Text style={styles.timerValue}>{totalTime || "0h 0m"}</Text>
            </View>
          ) : (
            <View style={styles.timerRow}>
              <MaterialCommunityIcons name="gesture-tap" size={15} color={NEON} />
              <Text style={styles.timerLabel}>Tap Clock In to start your day</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Punch orbs ─────────────────────────────────────────────── */}
        <View style={styles.orbRow}>
          <ClockButton
            time={clockInTime || "00:00 AM"}
            date="March 19, 2024 - Friday"
            type="in"
            onPress={handleClockIn}
            isLoading={isClockInLoading}
            disabled={isClockInDisabled}
            highlight={nextAction === "in"}
            caption={hasClockIn ? `In at ${clockInTime}` : "Start your shift"}
          />
          <ClockButton
            time={clockOutTime || "00:00 PM"}
            date="March 19, 2024 - Friday"
            type="out"
            onPress={handleClockOut}
            isLoading={isClockOutLoading}
            highlight={nextAction === "out"}
            caption={hasClockOut ? `Out at ${clockOutTime}` : "End your shift"}
          />
        </View>

        <View style={styles.hintRow}>
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color={BRAND.primaryMuted} />
          <Text style={styles.hintText}>
            Your location is captured automatically when you punch
          </Text>
        </View>

        {/* ── Today's activity ───────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Today's activity</Text>
            <View style={styles.totalChip}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={13} color={C.accent} />
              <Text style={styles.totalChipText}>{totalTime || "0h 0m"}</Text>
            </View>
          </View>

          {/* In ●────● Out track */}
          <View style={styles.track}>
            <View style={[styles.trackNode, hasClockIn && styles.trackNodeDone]}>
              <MaterialCommunityIcons
                name="login-variant"
                size={14}
                color={hasClockIn ? "#FFFFFF" : BRAND.primaryMuted}
              />
            </View>
            <View style={styles.trackLine}>
              {hasClockIn && (
                <LinearGradient
                  colors={hasClockOut ? [IN_GRADIENT[1], OUT_GRADIENT[1]] : [IN_GRADIENT[1], "rgba(0,102,194,0.15)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
            <View style={[styles.trackNode, hasClockOut && styles.trackNodeOut]}>
              <MaterialCommunityIcons
                name="logout-variant"
                size={14}
                color={hasClockOut ? "#FFFFFF" : BRAND.primaryMuted}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Text style={styles.footerValue}>{clockInTime || "Punch In"}</Text>
              <Text style={styles.footerText}>Clock In</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerValue}>{totalTime || "0h 0m"}</Text>
              <Text style={styles.footerText}>Totals</Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerValue}>{clockOutTime || "Punch Out"}</Text>
              <Text style={styles.footerText}>Clock Out</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ✦ Punch phase overlay — sits above content, below map modal */}
      <PunchOverlay phase={punchPhase} punchType={punchType} />

      {/* Map modal */}
      <Modal
        visible={isMapVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMap}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.mapContainer, { marginTop: insets.top, marginBottom: insets.bottom }]}>
            <LinearGradient
              colors={BRAND.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mapHeader}
            >
              <View style={styles.mapHeaderIcon}>
                <MaterialCommunityIcons name="map-marker-check" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapTitle}>Punch location</Text>
                <Text style={styles.mapSubtitle}>
                  {punchType === "out" ? "Clock out" : "Clock in"} recorded here
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.webviewWrapper}>
              {location ? (
                <WebView
                  originWhitelist={["*"]}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                  renderLoading={() => <MapLoading />}
                  mixedContentMode="always"
                  source={{
                    html: generateMapHTML(
                      location.latitude,
                      location.longitude,
                    ),
                  }}
                  style={styles.webview}
                />
              ) : (
                <MapLoading />
              )}
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.addressIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.accent} />
              </View>
              <Text style={styles.addressText}>
                {address || "Fetching address..."}
              </Text>
            </View>

            <TouchableOpacity onPress={closeMap} activeOpacity={0.9} style={styles.closeTouch}>
              <LinearGradient
                colors={BRAND.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = themedStyles((c) => ({
  // ── PunchOverlay ──
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayCard: {
    width: width * 0.8,
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: c.surface,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  overlayAccent: {
    paddingTop: 22,
    paddingBottom: 6,
    alignItems: "center",
  },
  overlayPhaseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: c.surfaceAlt,
  },
  overlayPhaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  overlayPhaseLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  lottieAnim: {
    width: 170,
    height: 170,
  },
  overlayTextSection: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 24,
    alignItems: "center",
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND.ink,
    marginBottom: 5,
    textAlign: "center",
  },
  overlaySublabel: {
    fontSize: 13,
    color: BRAND.inkSoft,
    textAlign: "center",
    marginBottom: 16,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.primaryFaint,
  },
  dotDone: {
    backgroundColor: c.primaryMuted,
  },
  dotActive: {
    width: 26,
  },

  // ── Screen ──
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },

  // Hero
  hero: {
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.12)",
  },
  heroRingLg: { width: 320, height: 320, top: -150, right: -130 },
  heroRingMd: { width: 220, height: 220, top: -100, right: -80 },
  heroRingSm: {
    width: 120,
    height: 120,
    top: -50,
    right: -30,
    backgroundColor: "rgba(125, 211, 252, 0.05)",
  },
  heroScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 54,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(125, 211, 252, 0.18)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBrandText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 2,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  clockWrap: {
    marginTop: 14,
    marginBottom: 14,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(125, 211, 252, 0.2)",
  },
  timerLabel: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  timerValue: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },

  // Orbs
  orbRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  orbColumn: {
    alignItems: "center",
  },
  orbStage: {
    width: ORB_SIZE * 1.12,
    height: ORB_SIZE * 1.12,
    alignItems: "center",
    justifyContent: "center",
  },
  orbShadow: {
    borderRadius: ORB_SIZE / 2,
    elevation: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    backgroundColor: c.surface,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orbInnerRing: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
  },
  orbSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ORB_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  buttonText: {
    fontSize: scaleFont(14),
    fontWeight: "800",
    color: "white",
    marginTop: 8,
    letterSpacing: 1.6,
  },
  disabledButton: { opacity: 0.75 },
  orbCaption: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.inkSoft,
    maxWidth: ORB_SIZE,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  hintText: {
    fontSize: 12,
    color: BRAND.inkSoft,
  },

  // Activity card
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 3,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  totalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  totalChipText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: c.accent,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 6,
  },
  trackNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: c.border,
  },
  trackNodeDone: {
    backgroundColor: IN_GRADIENT[1],
    borderColor: IN_GRADIENT[1],
  },
  trackNodeOut: {
    backgroundColor: OUT_GRADIENT[1],
    borderColor: OUT_GRADIENT[1],
  },
  trackLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 6,
    backgroundColor: c.primaryFaint,
    overflow: "hidden",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  footerItem: {
    flex: 1,
    alignItems: "center",
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: c.primaryFaint,
  },
  footerValue: {
    fontSize: scaleFont(14),
    fontWeight: "800",
    color: BRAND.ink,
    fontVariant: ["tabular-nums"],
  },
  footerText: {
    fontSize: scaleFont(11.5),
    color: BRAND.inkSoft,
    marginTop: 3,
    fontWeight: "600",
  },

  // Map modal
  modalContainer: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    width: "92%",
    height: "80%",
    backgroundColor: c.surface,
    borderRadius: 24,
    overflow: "hidden",
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mapHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mapSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  webviewWrapper: { flex: 1 },
  webview: { flex: 1 },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  mapLoadingLottie: {
    width: 140,
    height: 140,
  },
  mapLoadingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: c.text,
  },
  mapLoadingText: {
    fontSize: 13,
    color: c.textSoft,
    marginTop: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: c.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.primaryFaint,
  },
  addressText: {
    flex: 1,
    fontSize: scaleFont(13.5),
    color: BRAND.ink,
    lineHeight: 19,
  },
  closeTouch: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
}));

export default PunchScreen;
