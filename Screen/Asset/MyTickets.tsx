// Screen/Asset/MyTickets.tsx
import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import {
  Ticket,
  getMyTickets,
  cancelTicket,
  calculateTicketStats,
} from "../../Services/AssetModule/ticketService";
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { dialog } from "../../Component/Feedback/AppDialog";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import {
  AssetDialog,
  DeviceBadge,
  getDeviceTheme,
  HeroHeader,
  PAGE_BG,
  ViewMode,
  ViewToggle,
} from "./AssetUI";
import { themedStyles, C } from "../../Global/ThemeContext";

const VIEW_MODE_KEY = "myTicketsViewMode";
const GUTTER = 16;
const GRID_GAP = 10;

type StatusConfig = {
  bg: string;
  color: string;
  border: string;
  icon: any;
  short: string;
};

// Status color configuration
const getStatusConfig = (status: string): StatusConfig => {
  const configs: { [key: string]: StatusConfig } = {
    "pending for allocation": {
      bg: C.warningBg,
      color: C.warningText,
      border: "#f59e0b",
      icon: "clock-o",
      short: "Pending allocation",
    },
    "waiting for approval by manager": {
      bg: C.infoBg,
      color: C.infoText,
      border: "#4f46e5",
      icon: "user",
      short: "Awaiting manager",
    },
    allocated: {
      bg: C.successBg,
      color: C.successText,
      border: "#16a34a",
      icon: "check-circle",
      short: "Allocated",
    },
    approved: {
      bg: C.successBg,
      color: C.successText,
      border: "#16a34a",
      icon: "check-circle",
      short: "Approved",
    },
    manager: {
      bg: C.successBg,
      color: C.successText,
      border: "#16a34a",
      icon: "check",
      short: "Approved",
    },
    rejected: {
      bg: C.dangerBg,
      color: C.dangerText,
      border: "#dc2626",
      icon: "times-circle",
      short: "Rejected",
    },
    cancelled: {
      bg: C.surfaceAlt,
      color: C.text,
      border: "#6b7280",
      icon: "ban",
      short: "Cancelled",
    },
  };

  return (
    configs[status.toLowerCase()] || {
      bg: C.surfaceAlt,
      color: C.text,
      border: "#6b7280",
      icon: "question-circle",
      short: status,
    }
  );
};

const TICKET_STEPS = ["Raised", "Approved", "Allocated"];

type TicketProgressInfo = {
  completed: number;
  halted: "rejected" | "cancelled" | null;
};

// Maps a ticket status onto the Raised → Approved → Allocated tracker.
// completed = number of finished steps; halted marks a stopped request.
const getTicketProgress = (status: string): TicketProgressInfo => {
  const s = (status || "").toLowerCase();
  if (s.includes("allocated")) return { completed: 3, halted: null };
  if (s.includes("pending") || s.includes("approved") || s === "manager")
    return { completed: 2, halted: null };
  if (s.includes("rejected")) return { completed: 1, halted: "rejected" };
  if (s.includes("cancelled")) return { completed: 1, halted: "cancelled" };
  return { completed: 1, halted: null };
};

const CANCELABLE_STATUSES = [
  "pending for allocation",
  "waiting for approval by manager",
];

const canCancelTicket = (status: string): boolean =>
  CANCELABLE_STATUSES.includes(status.toLowerCase());

const getTicketId = (ticket: Ticket) => (ticket.id || ticket._id || "").toString();

const getDisplayId = (ticketId: string) =>
  (ticketId.length >= 6 ? ticketId.slice(-6) : ticketId.padStart(6, "0")).toUpperCase();

const formatRaisedOn = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Accent dots for the hero stats, tuned to read on the navy background.
const STAT_ACCENTS = {
  total: "#8EC5FF",
  pending: "#FBBF24",
  approved: "#34D399",
  others: "#F87171",
};

// ════════════════════════════════════════════════════════════════════════
//  Progress
// ════════════════════════════════════════════════════════════════════════

/** Three thin segments — the compact form of the tracker for list/grid. */
const MiniProgress = ({ status }: { status: string }) => {
  const progress = getTicketProgress(status);
  const haltColor = progress.halted === "rejected" ? BRAND.danger : "#9CA3AF";
  return (
    <View style={styles.miniTrack}>
      {TICKET_STEPS.map((step, index) => {
        const done = index < progress.completed;
        const halted = progress.halted !== null && index === progress.completed;
        return (
          <View key={step} style={styles.miniSegment}>
            {done ? (
              <LinearGradient
                colors={BRAND.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            ) : halted ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: haltColor }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

/** Full Raised → Approved → Allocated stepper, used in the detail sheet. */
const TicketStepper = ({ status }: { status: string }) => {
  const progress = getTicketProgress(status);
  return (
    <View style={styles.stepper}>
      {TICKET_STEPS.map((label, index) => {
        const isHaltNode = progress.halted !== null && index === progress.completed;
        const done = index < progress.completed;
        const current = !progress.halted && index === progress.completed;
        const connectorFilled = index + 1 <= progress.completed;
        const haltColor = progress.halted === "rejected" ? BRAND.danger : "#6B7280";

        return (
          <React.Fragment key={label}>
            <View style={styles.step}>
              {done ? (
                <LinearGradient
                  colors={BRAND.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepNode}
                >
                  <FontAwesome name="check" size={10} color="#FFFFFF" />
                </LinearGradient>
              ) : isHaltNode ? (
                <View style={[styles.stepNode, { backgroundColor: haltColor }]}>
                  <FontAwesome
                    name={progress.halted === "rejected" ? "times" : "ban"}
                    size={10}
                    color="#FFFFFF"
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepNode,
                    current ? styles.stepNodeCurrent : styles.stepNodeIdle,
                  ]}
                >
                  {current && <View style={styles.stepNodeDot} />}
                </View>
              )}
              <Text
                style={[
                  styles.stepLabel,
                  (done || current) && styles.stepLabelActive,
                  isHaltNode && { color: haltColor },
                ]}
                numberOfLines={1}
              >
                {isHaltNode
                  ? progress.halted === "rejected"
                    ? "Rejected"
                    : "Cancelled"
                  : label}
              </Text>
            </View>

            {index < TICKET_STEPS.length - 1 && (
              <View style={styles.connectorTrack}>
                {connectorFilled && (
                  <LinearGradient
                    colors={BRAND.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const StatusPill = ({ status, full }: { status: string; full?: boolean }) => {
  const config = getStatusConfig(status);
  return (
    <View
      style={[
        styles.statusPill,
        { backgroundColor: config.bg, borderColor: `${config.border}55` },
      ]}
    >
      <FontAwesome name={config.icon} size={10} color={config.color} />
      <Text
        style={[styles.statusPillText, { color: config.color }]}
        numberOfLines={1}
      >
        {full ? status : config.short}
      </Text>
    </View>
  );
};

// ════════════════════════════════════════════════════════════════════════
//  List row & grid card
// ════════════════════════════════════════════════════════════════════════

type ItemProps = {
  ticket: Ticket;
  cancelling: boolean;
  onPress: () => void;
};

const TicketListRow = ({ ticket, cancelling, onPress }: ItemProps) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.listRow}>
    <DeviceBadge category={ticket.category} size={42} />
    <View style={styles.listInfo}>
      <View style={styles.listTop}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {ticket.category}
        </Text>
        {cancelling ? (
          <ActivityIndicator size="small" color={BRAND.danger} />
        ) : (
          <StatusPill status={ticket.status} />
        )}
      </View>
      <Text style={styles.listMeta} numberOfLines={1}>
        #{getDisplayId(getTicketId(ticket))} · {formatRaisedOn(ticket.ticketRaisedOn)}
      </Text>
      <MiniProgress status={ticket.status} />
    </View>
  </TouchableOpacity>
);

const TicketGridCard = ({
  ticket,
  cancelling,
  onPress,
  width,
}: ItemProps & { width: number }) => {
  const theme = getDeviceTheme(ticket.category);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.gridCard, { width }]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gridHeader}
      >
        <MaterialCommunityIcons
          name={theme.icon}
          size={64}
          color="rgba(255, 255, 255, 0.09)"
          style={styles.gridWatermark}
        />
        <View style={styles.gridGlassIcon}>
          <MaterialCommunityIcons name={theme.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.gridIdChip}>
          <Text style={styles.gridIdText}>#{getDisplayId(getTicketId(ticket))}</Text>
        </View>
      </LinearGradient>

      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {ticket.category}
        </Text>
        <Text style={styles.gridDate}>{formatRaisedOn(ticket.ticketRaisedOn)}</Text>
        {cancelling ? (
          <ActivityIndicator
            size="small"
            color={BRAND.danger}
            style={styles.gridSpinner}
          />
        ) : (
          <StatusPill status={ticket.status} />
        )}
        <MiniProgress status={ticket.status} />
      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════════════════════════════════
//  Detail sheet
// ════════════════════════════════════════════════════════════════════════

const TicketDetailSheet = ({
  ticket,
  onClose,
  onCancelTicket,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onCancelTicket: (ticket: Ticket) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!ticket) return null;

  const theme = getDeviceTheme(ticket.category);
  const cancellable = canCancelTicket(ticket.status);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { maxHeight: height * 0.85, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheetHeader}
        >
          <MaterialCommunityIcons
            name={theme.icon}
            size={130}
            color="rgba(255, 255, 255, 0.08)"
            style={styles.sheetWatermark}
          />
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTopRow}>
            <View style={styles.sheetGlassIcon}>
              <MaterialCommunityIcons name={theme.icon} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.sheetTitleBlock}>
              <Text style={styles.sheetTitle} numberOfLines={2}>
                {ticket.category}
              </Text>
              <View style={styles.sheetMetaRow}>
                <View style={styles.sheetChip}>
                  <Text style={styles.sheetChipText}>
                    #{getDisplayId(getTicketId(ticket))}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={13}
                  color="rgba(255, 255, 255, 0.8)"
                />
                <Text style={styles.sheetDate}>
                  {formatRaisedOn(ticket.ticketRaisedOn)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sheetClose}
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.sheetBody}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetSection}>Current status</Text>
          <View style={styles.sheetStatusRow}>
            <StatusPill status={ticket.status} full />
          </View>

          <Text style={styles.sheetSection}>Progress</Text>
          <View style={styles.sheetCard}>
            <TicketStepper status={ticket.status} />
          </View>

          <Text style={styles.sheetSection}>Remark</Text>
          <View style={[styles.sheetCard, styles.remarkCard]}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={16}
              color={BRAND.primaryMuted}
            />
            <Text style={[styles.remarkText, !ticket.remark && styles.remarkEmpty]}>
              {ticket.remark || "No remarks yet."}
            </Text>
          </View>

          {cancellable && (
            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => onCancelTicket(ticket)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={18}
                color={BRAND.danger}
              />
              <Text style={styles.sheetCancelText}>Cancel this request</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════
//  Screen
// ════════════════════════════════════════════════════════════════════════

export default function MyTickets() {
  const { contentPaddingBottom } = useTabBarClearance();
  const { width } = useWindowDimensions();
  const gridCardWidth = (width - GUTTER * 2 - GRID_GAP) / 2;
  const dispatch = useDispatch();

  // Redux state
  const { myTickets, ticketStats, ticketLoading, cancellingTicket } =
    useSelector((state: any) => state);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filteredTickets, setFilteredTickets] = React.useState<Ticket[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelAction, setCancelAction] = useState<(() => void) | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      console.log(" [MyTickets] Component focused");
      loadTickets();
    }, [])
  );

  useEffect(() => {
    filterTickets();
  }, [myTickets, searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (saved === "grid" || saved === "list") setViewMode(saved);
      } catch {
        // Non-critical preference; keep the default.
      }
    })();
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_MODE_KEY, mode).catch(() => {});
  };

  const loadTickets = async () => {
    if (ticketLoading) return;

    console.log(" [MyTickets] Loading tickets from API");
    dispatch({ type: "SET_TICKET_LOADING", payload: true });

    try {
      const ticketData = await getMyTickets();

      // SORT BY ID (newest ticket first)
      const sorted = ticketData.sort(
        (a, b) => Number(b.id || b._id || 0) - Number(a.id || a._id || 0)
      );

      // update redux
      dispatch({ type: "SET_MY_TICKETS", payload: sorted });

      // update stats
      const stats = calculateTicketStats(sorted);
      dispatch({ type: "SET_TICKET_STATS", payload: stats });

      console.log(" [MyTickets] Tickets loaded:", ticketData.length);
    } catch (error) {
      console.error(" [MyTickets] Error loading tickets:", error);
      showAlert("error", "Error", "Failed to load tickets. Please try again.");
    } finally {
      dispatch({ type: "SET_TICKET_LOADING", payload: false });
    }
  };

  const filterTickets = () => {
    const filtered = myTickets.filter(
      (ticket: Ticket) =>
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTickets(filtered);
  };

  const handleCancelTicket = (ticket: Ticket) => {
    const ticketId = (ticket.id || ticket._id || "").toString();

    showConfirmAlert(
      "Cancel Request",
      `Are you sure you want to cancel the ${ticket.category} request?`,
      async () => {
        dispatch({ type: "SET_CANCELLING_TICKET", payload: ticketId });

        try {
          await cancelTicket(ticketId);

          // Remove ticket from Redux store
          dispatch({ type: "DELETE_TICKET", payload: ticketId });

          // Remove ticket from Redux FIRST
          const newList = myTickets.filter(
            (t: Ticket) => (t.id || t._id || "").toString() !== ticketId
          );

          dispatch({ type: "SET_MY_TICKETS", payload: newList });

          const newStats = calculateTicketStats(newList);
          dispatch({ type: "SET_TICKET_STATS", payload: newStats });

          showSuccessAlert("Success", "Request cancelled successfully!");
        } catch (error: any) {
          console.error(" [MyTickets] Error cancelling ticket:", error);

          if (error.message && error.message.includes("JSON Parse")) {
            // Handle JSON parse error as success
            dispatch({ type: "DELETE_TICKET", payload: ticketId });
            const updatedTickets = myTickets.filter(
              (t: Ticket) => (t.id || t._id || "").toString() !== ticketId
            );
            const updatedStats = calculateTicketStats(updatedTickets);
            dispatch({ type: "SET_TICKET_STATS", payload: updatedStats });
            showSuccessAlert("Success", "Request cancelled successfully!");
          } else {
            showAlert(
              "error",
              "Error",
              error.message || "Failed to cancel request."
            );
          }
        } finally {
          dispatch({ type: "SET_CANCELLING_TICKET", payload: null });
        }
      }
    );
  };

  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) => {
    dialog.alert(title, message, type);
  };

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setCancelMessage(message);
    setCancelAction(() => onConfirm); // store callback
    setCancelModalVisible(true);
  };

  const showSuccessAlert = (title: string, message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  // Close the sheet first; stacking two modals at once is unreliable on iOS.
  const cancelFromSheet = (ticket: Ticket) => {
    setSelectedTicket(null);
    setTimeout(() => handleCancelTicket(ticket), 300);
  };

  const renderStat = (label: string, value: number, accent: string) => (
    <GlassSurface tone="dark" radius={12} style={styles.statTile}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <View style={styles.statBottom}>
        <View style={[styles.statDot, { backgroundColor: accent }]} />
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </GlassSurface>
  );

  const renderItem = ({ item }: { item: Ticket }) => {
    const props = {
      ticket: item,
      cancelling: cancellingTicket === getTicketId(item),
      onPress: () => setSelectedTicket(item),
    };
    return viewMode === "grid" ? (
      <TicketGridCard {...props} width={gridCardWidth} />
    ) : (
      <TicketListRow {...props} />
    );
  };

  // Rendered as an element (not a component) so the search input keeps
  // focus while the list re-renders.
  const listHeader = (
    <View>
      <HeroHeader
        title="My Requests"
        subtitle="Track your asset requests"
        style={styles.hero}
      >
        <View style={styles.statsRow}>
          {renderStat("Total", ticketStats.total, STAT_ACCENTS.total)}
          {renderStat("Pending", ticketStats.pending, STAT_ACCENTS.pending)}
          {renderStat(
            "Approved",
            ticketStats.approved + ticketStats.allocated,
            STAT_ACCENTS.approved
          )}
          {renderStat(
            "Others",
            ticketStats.rejected + ticketStats.cancelled,
            STAT_ACCENTS.others
          )}
        </View>
      </HeroHeader>

      {/* Search, floating over the hero's bottom edge */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            searchFocused && styles.searchInputFocused,
          ]}
        >
          <FontAwesome
            name="search"
            size={15}
            color={searchFocused ? C.accent : BRAND.primaryMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category or status..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholderTextColor={C.placeholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
            >
              <FontAwesome name="times" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>
          {searchQuery ? "Search results" : "Recent requests"}
        </Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{filteredTickets.length}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <ViewToggle mode={viewMode} onChange={changeViewMode} />
      </View>
    </View>
  );

  const listEmpty =
    ticketLoading && myTickets.length === 0 ? (
      <View style={styles.stateBox}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading your requests...</Text>
      </View>
    ) : (
      <View style={styles.stateBox}>
        <View style={styles.emptyIconRing}>
          <FontAwesome
            name={myTickets.length === 0 ? "ticket" : "search"}
            size={30}
            color={C.accent}
          />
        </View>
        <Text style={styles.emptyStateTitle}>
          {myTickets.length === 0 ? "No Requests Yet" : "No Results Found"}
        </Text>
        <Text style={styles.emptyStateText}>
          {myTickets.length === 0
            ? "Raise your first asset request to get started"
            : "Try adjusting your search criteria"}
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      <FlatList
        key={viewMode} // numColumns can't change on a mounted list
        data={filteredTickets}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item.id || item._id || index).toString()}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={ticketLoading}
            onRefresh={loadTickets}
            colors={[C.accent]}
            tintColor={C.accent}
          />
        }
      />

      <TicketDetailSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onCancelTicket={cancelFromSheet}
      />

      <AssetDialog
        visible={cancelModalVisible}
        variant="cancel"
        title="Cancel Request?"
        message={cancelMessage}
        secondaryLabel="Close"
        onSecondary={() => setCancelModalVisible(false)}
        primaryLabel="Yes, Cancel"
        onPrimary={() => {
          setCancelModalVisible(false);
          if (cancelAction) cancelAction();
        }}
      />

      <AssetDialog
        visible={successModalVisible}
        variant="success"
        title="Success"
        message={successMessage}
        primaryLabel="OK"
        onPrimary={() => setSuccessModalVisible(false)}
      />
    </View>
  );
}

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Extra bottom room so the search bar can overlap the hero.
  hero: {
    paddingBottom: 40,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statTile: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statLabel: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
  },

  // Search
  searchContainer: {
    paddingHorizontal: GUTTER,
    marginTop: -24,
    zIndex: 2,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    elevation: 6,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  searchInputFocused: {
    borderColor: "rgba(0, 86, 160, 0.35)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND.ink,
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 41, 87, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER + 2,
    paddingTop: 16,
    paddingBottom: 10,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  countChip: {
    marginLeft: 8,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
  },
  countChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.accent,
  },

  // Shared pills
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 1,
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    flexShrink: 1,
    textTransform: "capitalize",
  },
  miniTrack: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  miniSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.primaryFaint,
    overflow: "hidden",
  },

  // List row
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: GUTTER,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 1,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.ink,
  },
  listMeta: {
    fontSize: 11.5,
    color: BRAND.inkSoft,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Grid card
  gridRow: {
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    marginBottom: GRID_GAP,
  },
  gridCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 2,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  gridHeader: {
    height: 58,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  gridWatermark: {
    position: "absolute",
    right: -10,
    bottom: -16,
    transform: [{ rotate: "-12deg" }],
  },
  gridGlassIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  gridIdChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  gridIdText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  gridBody: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: BRAND.ink,
  },
  gridDate: {
    fontSize: 11,
    color: BRAND.inkSoft,
    marginTop: 2,
    marginBottom: 8,
  },
  gridSpinner: {
    alignSelf: "flex-start",
  },

  // Detail sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    overflow: "hidden",
  },
  sheetWatermark: {
    position: "absolute",
    right: -20,
    bottom: -34,
    transform: [{ rotate: "-12deg" }],
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: 14,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetGlassIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  sheetTitleBlock: {
    flex: 1,
    marginHorizontal: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sheetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  sheetChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    marginRight: 4,
  },
  sheetChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  sheetDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  sheetBody: {
    paddingHorizontal: GUTTER,
    paddingTop: 6,
  },
  sheetSection: {
    fontSize: 11,
    fontWeight: "700",
    color: c.primaryMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  sheetStatusRow: {
    flexDirection: "row",
  },
  sheetCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  remarkCard: {
    flexDirection: "row",
    gap: 10,
  },
  remarkText: {
    flex: 1,
    fontSize: 13.5,
    color: BRAND.ink,
    lineHeight: 19,
  },
  remarkEmpty: {
    fontStyle: "italic",
    color: BRAND.inkSoft,
  },
  sheetCancel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "rgba(214, 69, 69, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(214, 69, 69, 0.25)",
  },
  sheetCancelText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: BRAND.danger,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  step: {
    alignItems: "center",
    width: 64,
  },
  stepNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNodeCurrent: {
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: BRAND.primaryLight,
  },
  stepNodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primaryLight,
  },
  stepNodeIdle: {
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: c.border,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.primaryMuted,
    marginTop: 6,
  },
  stepLabelActive: {
    color: c.accent,
  },
  connectorTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginTop: 10,
    marginHorizontal: -18,
    backgroundColor: c.primaryFaint,
    overflow: "hidden",
  },

  // States
  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 36,
    gap: 6,
  },
  loadingText: {
    fontSize: 15,
    color: c.accent,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyIconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.ink,
  },
  emptyStateText: {
    fontSize: 14,
    color: BRAND.inkSoft,
    textAlign: "center",
    lineHeight: 21,
  },
}));
