import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
  RefreshControl,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSelector } from "react-redux";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { managerLeaveRequestClass } from "../../Services/LeaveRequest/LeaveRequest.service";
import { themedStyles, C } from "../../Global/ThemeContext";
import { BRAND } from "../../Global/GlassTheme";
import { AppDialog, DialogDetails, dialog } from "../../Component/Feedback/AppDialog";
import { LoadingScreen } from "../../Component/Feedback/LoadingScreen";
import { canApproveLeaves } from "../../src/utils/roles";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NEON = "#7DD3FC";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const AVATAR_GRADIENTS = [
  ["#0B3D7A", "#1E6FD9"],
  ["#4C1D95", "#7C3AED"],
  ["#065F46", "#10B981"],
  ["#9A3412", "#F97316"],
  ["#831843", "#DB2777"],
  ["#134E4A", "#14B8A6"],
] as const;

type Decision = "approve" | "reject";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value?: string | null) => {
  const d = toDate(value);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}` : value || "—";
};

const isHalfDay = (part?: string) => part === "first-half" || part === "second-half";

const formatLeavePart = (part?: string) => {
  switch (part) {
    case "first-half":
      return "First half";
    case "second-half":
      return "Second half";
    case "full-day":
      return "Full day";
    default:
      return part || "";
  }
};

/** Inclusive calendar days between start and end; a single half-day counts 0.5. */
const leaveDays = (item: any): number => {
  const start = toDate(item.leavestart);
  const end = toDate(item.leaveend) ?? start;
  if (!start || !end) return 0;
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.max(1, Math.round((day(end) - day(start)) / 86400000) + 1);
  return days === 1 && isHalfDay(item.leavepart) ? 0.5 : days;
};

const formatDays = (n: number) => (n === 0.5 ? "½ day" : `${n} day${n === 1 ? "" : "s"}`);

const appliedAgo = (value?: string | null) => {
  const d = toDate(value);
  if (!d) return "";
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff <= 0) return "Applied today";
  if (diff === 1) return "Applied yesterday";
  if (diff < 7) return `Applied ${diff} days ago`;
  return `Applied ${formatDate(value)}`;
};

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const hashIndex = (text: string, size: number) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % size;
};

// Leave-type pill tones, picked per type so each type keeps its colour.
const typeTone = (type: string) => {
  const tones = [
    { bg: C.infoBg, fg: C.infoText },
    { bg: C.violetBg, fg: C.violetText },
    { bg: C.successBg, fg: C.successText },
    { bg: C.warningBg, fg: C.warningText },
  ];
  return tones[hashIndex(String(type || "").toUpperCase(), tones.length)];
};

// ─── Pieces ───────────────────────────────────────────────────────────────────

const DateTile = ({ value, label }: { value?: string; label: string }) => {
  const d = toDate(value);
  return (
    <View style={styles.dateTile}>
      <Text style={styles.dateTileLabel}>{label}</Text>
      {d ? (
        <>
          <Text style={styles.dateTileDay}>{d.getDate()}</Text>
          <Text style={styles.dateTileMonth}>
            {WEEKDAYS[d.getDay()]}, {MONTHS[d.getMonth()]}
          </Text>
        </>
      ) : (
        <Text style={styles.dateTileDay}>—</Text>
      )}
    </View>
  );
};

// Revealed behind a card when it is swiped left. Brand-styled: Approve is the
// primary navy action, Reject a quieter frosted outline. Tiles grow in with the drag.
const SwipeActions = ({
  progress,
  onDecide,
}: {
  progress: Animated.AnimatedInterpolation<number>;
  onDecide: (decision: Decision) => void;
}) => {
  const reveal = (start: number) => ({
    opacity: progress.interpolate({
      inputRange: [start, start + 0.55],
      outputRange: [0, 1],
      extrapolate: "clamp",
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [start, start + 0.7],
          outputRange: [0.6, 1],
          extrapolate: "clamp",
        }),
      },
    ],
  });
  // The icon badge turns in slightly as the tile arrives.
  const spin = (start: number) => ({
    transform: [
      {
        rotate: progress.interpolate({
          inputRange: [start, start + 0.8],
          outputRange: ["-45deg", "0deg"],
          extrapolate: "clamp",
        }),
      },
    ],
  });

  return (
    <View style={styles.swipeActions}>
      {/* Approve: primary, navy gradient with hero rings */}
      <Animated.View style={[styles.swipeTileWrap, reveal(0)]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onDecide("approve")}
          accessibilityRole="button"
          accessibilityLabel="Approve"
          style={styles.swipeTouch}
        >
          <LinearGradient
            colors={C.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.swipeTile}
          >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View style={[styles.tileRing, styles.tileRingLg]} />
              <View style={[styles.tileRing, styles.tileRingSm]} />
            </View>
            <Animated.View style={[styles.approveBadge, spin(0)]}>
              <MaterialCommunityIcons name="check-bold" size={20} color={C.primary} />
            </Animated.View>
            <Text style={styles.approveTileText}>Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Reject: secondary, frosted surface with brand outline */}
      <Animated.View style={[styles.swipeTileWrap, reveal(0.15)]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onDecide("reject")}
          accessibilityRole="button"
          accessibilityLabel="Reject"
          style={[styles.swipeTouch, styles.rejectTile]}
        >
          <View style={styles.rejectSheen} />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.rejectRing, styles.tileRingLg]} />
            <View style={[styles.rejectRing, styles.rejectRingSm]} />
          </View>
          <Animated.View style={[styles.rejectBadge, spin(0.15)]}>
            <MaterialCommunityIcons name="close-thick" size={18} color={C.accent} />
          </Animated.View>
          <Text style={styles.rejectTileText}>Reject</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const RequestCard = ({
  item,
  index,
  processing,
  peek,
  registerRef,
  onOpen,
  onDecide,
}: {
  item: any;
  index: number;
  processing: Decision | null;
  peek: boolean;
  registerRef: (id: any, ref: Swipeable | null) => void;
  onOpen: (id: any) => void;
  onDecide: (decision: Decision, item: any) => void;
}) => {
  const enter = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef<Swipeable | null>(null);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 6) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // One-time hint: briefly slide the first card open so the gesture is discoverable.
  useEffect(() => {
    if (!peek) return;
    const open = setTimeout(() => swipeRef.current?.openRight(), 900);
    const close = setTimeout(() => swipeRef.current?.close(), 1900);
    return () => {
      clearTimeout(open);
      clearTimeout(close);
    };
  }, [peek]);

  const name = item.user?.name || "Unknown employee";
  const gradient = AVATAR_GRADIENTS[hashIndex(name, AVATAR_GRADIENTS.length)];
  const tone = typeTone(item.leavetype);
  const days = leaveDays(item);
  const sameDay = days <= 1;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      <Swipeable
        ref={(ref) => {
          swipeRef.current = ref;
          registerRef(item.id, ref);
        }}
        enabled={!processing}
        friction={1.6}
        overshootRight={false}
        rightThreshold={48}
        containerStyle={styles.swipeContainer}
        onSwipeableWillOpen={() => onOpen(item.id)}
        renderRightActions={(progress) => (
          <SwipeActions
            progress={progress}
            onDecide={(decision) => {
              swipeRef.current?.close();
              onDecide(decision, item);
            }}
          />
        )}
      >
        <View style={styles.card}>
          {/* Techno backdrop: gradient wash, accent strip, rings, HUD corners, dot grid */}
          <View pointerEvents="none" style={styles.cardDecor}>
            <LinearGradient
              colors={[C.surface, C.surfaceAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[C.primaryLight, NEON, C.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardAccent}
            />
            <View style={[styles.cardRing, styles.cardRingLg]} />
            <View style={[styles.cardRing, styles.cardRingSm]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={styles.dotGrid}>
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>

          {/* Who */}
          <View style={styles.cardHeader}>
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </LinearGradient>
            <View style={styles.headerContent}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={C.textFaint} />
                <Text style={styles.metaText}>{appliedAgo(item.applydate)}</Text>
              </View>
            </View>
            {!!item.leavetype && (
              <View style={[styles.typePill, { backgroundColor: tone.bg }]}>
                <Text style={[styles.typePillText, { color: tone.fg }]}>{item.leavetype}</Text>
              </View>
            )}
          </View>

          {/* Glowing scan line between who and when */}
          <LinearGradient
            colors={["transparent", C.primaryMuted, NEON, C.primaryMuted, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanLine}
          />

          {/* When */}
          <View style={styles.dateRow}>
            <DateTile value={item.leavestart} label="FROM" />
            {!sameDay && (
              <>
                <MaterialCommunityIcons name="arrow-right" size={18} color={C.primaryMuted} />
                <DateTile value={item.leaveend} label="TO" />
              </>
            )}
            <View style={styles.daysBadge}>
              <Text style={styles.daysValue}>{days === 0.5 ? "½" : days}</Text>
              <Text style={styles.daysLabel}>{days <= 1 ? "day" : "days"}</Text>
            </View>
          </View>

          {/* Why */}
          {!!item.leavepart && (
            <View style={styles.partRow}>
              <MaterialCommunityIcons
                name={isHalfDay(item.leavepart) ? "circle-half-full" : "circle"}
                size={13}
                color={C.accent}
              />
              <Text style={styles.partText}>{formatLeavePart(item.leavepart)}</Text>
            </View>
          )}
          {!!item.reason && (
            <View style={styles.reasonBox}>
              <MaterialCommunityIcons name="format-quote-open" size={16} color={C.primaryMuted} />
              <Text style={styles.reasonText} numberOfLines={4}>
                {item.reason}
              </Text>
            </View>
          )}

          {/* Swipe affordance on the right edge */}
          <View pointerEvents="none" style={styles.grabber}>
            <MaterialCommunityIcons name="chevron-double-left" size={16} color={C.primaryMuted} />
          </View>

          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator
                size="small"
                color={C.accent}
              />
              <Text
                style={[
                  styles.processingText,
                  { color: C.accent },
                ]}
              >
                {processing === "approve" ? "Approving…" : "Rejecting…"}
              </Text>
            </View>
          )}
        </View>
      </Swipeable>
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const LeaveRequest = () => {
  const userDetails = useSelector((state: any) => state.userDetails);
  const userID = userDetails?.user?.id;
  const allowed = canApproveLeaves(userDetails?.user?.role);

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: Decision; request: any } | null>(null);
  const [processing, setProcessing] = useState<{ id: any; type: Decision } | null>(null);
  const [peekDone, setPeekDone] = useState(false);

  // Only one card open at a time.
  const swipeRefs = useRef(new Map<any, Swipeable>());
  const registerRef = useCallback((id: any, ref: Swipeable | null) => {
    if (ref) swipeRefs.current.set(id, ref);
    else swipeRefs.current.delete(id);
  }, []);
  const closeOthers = useCallback((id: any) => {
    swipeRefs.current.forEach((ref, key) => {
      if (key !== id) ref.close();
    });
  }, []);

  // Peek the first card once, shortly after the list first appears.
  useEffect(() => {
    if (peekDone || loading || leaveRequests.length === 0) return;
    const t = setTimeout(() => setPeekDone(true), 2200);
    return () => clearTimeout(t);
  }, [peekDone, loading, leaveRequests.length]);

  const fetchLeaveRequests = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!allowed || !userID) return;
      mode === "refresh" ? setRefreshing(true) : setLoading(true);
      try {
        const data = await managerLeaveRequestClass.LeaveRequestGet(userID);
        setLeaveRequests(Array.isArray(data?.data) ? data.data : []);
        setLoadError(null);
      } catch (error: any) {
        console.error("Failed to fetch leave requests:", error);
        setLoadError(error?.message || "Couldn't load leave requests.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userID, allowed],
  );

  useFocusEffect(
    useCallback(() => {
      fetchLeaveRequests();
    }, [fetchLeaveRequests]),
  );

  const decide = async (request: any, type: Decision) => {
    setConfirm(null);
    setProcessing({ id: request.id, type });
    try {
      await managerLeaveRequestClass.LeaveStatusUpdate(
        request.id,
        type === "approve" ? "approved" : "declined",
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLeaveRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error(`Error updating leave status (${type}):`, error);
      dialog.alert(
        "Couldn't update request",
        "The leave request could not be updated. Please try again.",
        "error",
      );
    } finally {
      setProcessing(null);
    }
  };

  const summary = useMemo(() => {
    const totalDays = leaveRequests.reduce((sum, r) => sum + leaveDays(r), 0);
    const starts = leaveRequests
      .map((r) => toDate(r.leavestart))
      .filter(Boolean)
      .sort((a: any, b: any) => a - b) as Date[];
    const next = starts[0];
    return {
      totalDays,
      next: next ? `${next.getDate()} ${MONTHS[next.getMonth()]}` : "—",
    };
  }, [leaveRequests]);

  if (!allowed) {
    return (
      <View style={styles.stateWrap}>
        <View style={[styles.stateIcon, { backgroundColor: C.neutralBg }]}>
          <MaterialCommunityIcons name="lock-outline" size={34} color={C.textSoft} />
        </View>
        <Text style={styles.stateTitle}>Managers only</Text>
        <Text style={styles.stateText}>
          Leave approvals are available to managers and admins.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading leave requests" submessage="Fetching pending approvals" />;
  }

  const count = leaveRequests.length;

  const header = (
    <LinearGradient colors={C.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.heroRing, styles.heroRingLg]} />
        <View style={[styles.heroRing, styles.heroRingMd]} />
        <View style={[styles.heroRing, styles.heroRingSm]} />
      </View>

      <View style={styles.heroBrand}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={14} color={NEON} />
        <Text style={styles.heroBrandText}>LEAVE APPROVALS</Text>
      </View>

      <View style={styles.heroCountRow}>
        <Text style={styles.heroCount}>{count}</Text>
        <Text style={styles.heroCountLabel}>
          {count === 1 ? "request awaiting\nyour decision" : "requests awaiting\nyour decision"}
        </Text>
      </View>

      <View style={styles.heroStats}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{formatDays(summary.totalDays)}</Text>
          <Text style={styles.heroStatLabel}>Requested</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatValue}>{summary.next}</Text>
          <Text style={styles.heroStatLabel}>Earliest start</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const empty = loadError ? (
    <View style={styles.stateWrap}>
      <View style={[styles.stateIcon, { backgroundColor: C.dangerBg }]}>
        <MaterialCommunityIcons name="wifi-alert" size={34} color={C.dangerText} />
      </View>
      <Text style={styles.stateTitle}>Couldn't load requests</Text>
      <Text style={styles.stateText}>{loadError}</Text>
      <TouchableOpacity style={styles.stateBtn} onPress={() => fetchLeaveRequests()} activeOpacity={0.85}>
        <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.stateBtnText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.stateWrap}>
      <View style={[styles.stateIcon, { backgroundColor: C.successBg }]}>
        <MaterialCommunityIcons name="check-all" size={34} color={C.successText} />
      </View>
      <Text style={styles.stateTitle}>All caught up</Text>
      <Text style={styles.stateText}>No leave requests are waiting for your approval.</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        data={leaveRequests}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <RequestCard
            item={item}
            index={index}
            processing={processing?.id === item.id ? processing.type : null}
            peek={index === 0 && !peekDone}
            registerRef={registerRef}
            onOpen={closeOthers}
            onDecide={(type, request) => setConfirm({ type, request })}
          />
        )}
        ListHeaderComponent={
          <>
            {header}
            {count > 0 && (
              <View style={styles.hintRow}>
                <MaterialCommunityIcons name="gesture-swipe-left" size={16} color={C.accent} />
                <Text style={styles.hintText}>Swipe a card left to approve or reject</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={empty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLeaveRequests("refresh")}
            colors={[BRAND.primary]}
            tintColor={C.accent}
          />
        }
      />

      {/* Approve / reject confirmation */}
      <AppDialog
        visible={!!confirm}
        variant="confirm"
        lottie={null}
        icon={confirm?.type === "approve" ? "check-decagram-outline" : "close-circle-outline"}
        title={confirm?.type === "approve" ? "Approve leave?" : "Reject leave?"}
        message={`${confirm?.type === "approve" ? "Approve" : "Reject"} ${
          confirm?.request?.user?.name || "this employee"
        }'s leave request?`}
        secondaryLabel="Cancel"
        onSecondary={() => setConfirm(null)}
        primaryLabel={confirm?.type === "approve" ? "Approve" : "Reject"}
        onPrimary={() => confirm && decide(confirm.request, confirm.type)}
      >
        {confirm?.request && (
          <DialogDetails
            rows={[
              { label: "Leave type", value: confirm.request.leavetype },
              {
                label: "Duration",
                value: `${formatDate(confirm.request.leavestart)} to ${formatDate(
                  confirm.request.leaveend,
                )} · ${formatDays(leaveDays(confirm.request))}`,
              },
              { label: "Reason", value: confirm.request.reason },
            ]}
          />
        )}
      </AppDialog>
    </GestureHandlerRootView>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // Hero
  hero: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  heroRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.12)",
  },
  heroRingLg: { width: 300, height: 300, top: -150, right: -120 },
  heroRingMd: { width: 200, height: 200, top: -95, right: -70 },
  heroRingSm: {
    width: 110,
    height: 110,
    top: -45,
    right: -25,
    backgroundColor: "rgba(125, 211, 252, 0.05)",
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
  heroCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  heroCount: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 54,
  },
  heroCountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 19,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 14,
  },

  // Card
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 16,
    paddingLeft: 20,
    paddingRight: 26,
    borderWidth: 1,
    borderColor: c.borderStrong,
    elevation: 3,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  cardDecor: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardRingLg: { width: 170, height: 170, top: -90, right: -70 },
  cardRingSm: {
    width: 96,
    height: 96,
    top: -48,
    right: -30,
    backgroundColor: c.primaryFaint,
  },
  bracket: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: c.primaryMuted,
    opacity: 0.6,
  },
  bracketTR: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  bracketBL: {
    bottom: 8,
    left: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  dotGrid: {
    position: "absolute",
    right: 14,
    bottom: 12,
    width: 5 * 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    opacity: 0.55,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: c.primaryMuted,
  },
  scanLine: {
    height: 1.5,
    marginTop: 14,
    marginBottom: -2,
    borderRadius: 1,
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: c.textFaint,
    fontWeight: "500",
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: c.primaryFaint,
    borderWidth: 1,
    borderColor: c.border,
  },
  dateTile: {
    minWidth: 64,
  },
  dateTileLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: c.textFaint,
    letterSpacing: 1.2,
  },
  dateTileDay: {
    fontSize: 22,
    fontWeight: "800",
    color: c.accent,
    lineHeight: 27,
  },
  dateTileMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSoft,
  },
  daysBadge: {
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: c.primaryFaint,
    borderWidth: 1,
    borderColor: c.border,
  },
  daysValue: {
    fontSize: 20,
    fontWeight: "800",
    color: c.accent,
    lineHeight: 24,
  },
  daysLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: c.textSoft,
  },

  partRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  partText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.accent,
  },
  reasonBox: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: c.borderStrong,
  },
  reasonText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: c.textSoft,
  },

  // Swipe
  swipeContainer: {
    marginBottom: 14,
    borderRadius: 20,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    paddingLeft: 10,
  },
  swipeTileWrap: {
    width: 86,
  },
  swipeTouch: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  swipeTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tileRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.18)",
  },
  tileRingLg: { width: 130, height: 130, top: -60, right: -60 },
  tileRingSm: {
    width: 70,
    height: 70,
    bottom: -30,
    left: -26,
    backgroundColor: "rgba(125, 211, 252, 0.06)",
  },
  approveBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "rgba(125, 211, 252, 0.55)",
    shadowColor: "#7DD3FC",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  approveTileText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  rejectTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
  },
  rejectSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: c.primaryFaint,
  },
  rejectRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  rejectRingSm: {
    width: 70,
    height: 70,
    bottom: -30,
    left: -26,
    backgroundColor: c.primaryFaint,
  },
  rejectBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
  },
  rejectTileText: {
    fontSize: 13,
    fontWeight: "800",
    color: c.accent,
    letterSpacing: 0.3,
  },
  grabber: {
    position: "absolute",
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    opacity: 0.7,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: c.surface,
    opacity: 0.94,
  },
  processingText: {
    fontSize: 15,
    fontWeight: "700",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: c.primaryFaint,
  },
  hintText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.accent,
  },

  // Empty / error / locked
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    backgroundColor: c.background,
  },
  stateIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: c.text,
    marginBottom: 6,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: c.textSoft,
    textAlign: "center",
  },
  stateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: c.primary,
  },
  stateBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
}));

export default LeaveRequest;
