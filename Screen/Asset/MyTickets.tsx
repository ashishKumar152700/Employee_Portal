// Screen/Asset/MyTickets.tsx
import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import {
  Ticket,
  TicketStats,
  getMyTickets,
  cancelTicket,
  calculateTicketStats,
} from "../../Services/AssetModule/ticketService";
import { Modal, Animated, Easing } from "react-native";
import LottieView from "lottie-react-native";

// Status color configuration
const getStatusConfig = (status: string) => {
  const configs: {
    [key: string]: { bg: string; color: string; border: string; icon: string };
  } = {
    "pending for allocation": {
      bg: "#fef3c7",
      color: "#92400e",
      border: "#f59e0b",
      icon: "clock-o",
    },
    "waiting for approval by manager": {
      bg: "#e0e7ff",
      color: "#3730a3",
      border: "#4f46e5",
      icon: "user",
    },
    allocated: {
      bg: "#dcfce7",
      color: "#166534",
      border: "#16a34a",
      icon: "check-circle",
    },
    approved: {
      bg: "#dcfce7",
      color: "#166534",
      border: "#16a34a",
      icon: "check-circle",
    },
    manager: {
      bg: "#dcfce7",
      color: "#166534",
      border: "#16a34a",
      icon: "check",
    },
    rejected: {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#dc2626",
      icon: "times-circle",
    },
    cancelled: {
      bg: "#f3f4f6",
      color: "#374151",
      border: "#6b7280",
      icon: "ban",
    },
  };

  return (
    configs[status.toLowerCase()] || {
      bg: "#f3f4f6",
      color: "#374151",
      border: "#6b7280",
      icon: "question-circle",
    }
  );
};

export default function MyTickets() {
  const dispatch = useDispatch();

  // Redux state
  const { myTickets, ticketStats, ticketLoading, cancellingTicket } =
    useSelector((state: any) => state);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredTickets, setFilteredTickets] = React.useState<Ticket[]>([]);
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [ticketToCancel, setTicketToCancel] = React.useState<Ticket | null>(
    null
  );
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const [cancelAction, setCancelAction] = useState<(() => void) | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successSlideAnim = useRef(new Animated.Value(300)).current;

  useFocusEffect(
    useCallback(() => {
      console.log(" [MyTickets] Component focused");
      loadTickets();
    }, [])
  );

  useEffect(() => {
    filterTickets();
  }, [myTickets, searchQuery]);

  const loadTickets = async () => {
    if (ticketLoading) return;

    console.log(" [MyTickets] Loading tickets from API");
    dispatch({ type: "SET_TICKET_LOADING", payload: true });

    try {
      const ticketData = await getMyTickets();

      // SORT — newest first
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

          // Update stats
          const updatedTickets = myTickets.filter(
            (t: Ticket) => (t.id || t._id || "").toString() !== ticketId
          );
          const updatedStats = calculateTicketStats(updatedTickets);
          dispatch({ type: "SET_TICKET_STATS", payload: updatedStats });

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

  const canCancelTicket = (status: string): boolean => {
    const cancelableStatuses = [
      "pending for allocation",
      "waiting for approval by manager",
    ];
    return cancelableStatuses.includes(status.toLowerCase());
  };

  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) => {
    const icons = { success: "✅", error: "❌", warning: "⚠️" };
    Alert.alert(`${icons[type]} ${title}`, message, [
      { text: "OK", style: "default" },
    ]);
  };

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setCancelAction(() => onConfirm); // store callback
    setCancelModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const showSuccessAlert = (title: string, message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);

    Animated.timing(successSlideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const renderStatCard = ({
    label,
    value,
    color,
    icon,
  }: {
    label: string;
    value: number;
    color: string;
    icon: string;
  }) => (
    <View
      style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
    >
      <Text style={[styles.statValue, { color }]}>
        <FontAwesome name={icon} size={20} color={color} /> {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    const statusConfig = getStatusConfig(item.status);
    const ticketId = (item.id || item._id || "").toString();
    const displayId =
      ticketId.length >= 6 ? ticketId.slice(-6) : ticketId.padStart(6, "0");
    const isCancelling = cancellingTicket === ticketId;
    const canCancel = canCancelTicket(item.status) && !isCancelling;

    return (
      <View style={styles.ticketCard}>
        <LinearGradient
          colors={["rgba(0, 41, 87, 0.02)", "rgba(0, 41, 87, 0.01)"]}
          style={styles.ticketCardGradient}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketId}>#{displayId.toUpperCase()}</Text>
              <Text style={styles.ticketCategory}>{item.category}</Text>
              {item.remark && (
                <Text style={styles.ticketRemark} numberOfLines={2}>
                  {item.remark}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusConfig.bg,
                  borderColor: statusConfig.border,
                },
              ]}
            >
              <FontAwesome
                name={statusConfig.icon}
                size={12}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <View style={styles.ticketDateContainer}>
              <FontAwesome name="calendar" size={12} color="#6B7280" />
              <Text style={styles.ticketDate}>
                {new Date(item.ticketRaisedOn).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>

            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelTicket(item)}
                disabled={isCancelling}
              >
                <LinearGradient
                  colors={["#dc2626", "#b91c1c"]}
                  style={styles.cancelButtonGradient}
                >
                  {isCancelling ? (
                    <ActivityIndicator size={16} color="white" />
                  ) : (
                    <>
                      <FontAwesome name="times" size={14} color="white" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
      <Text style={styles.loadingText}>Loading your requests...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.8)"]}
        style={styles.header}
      >
        <Text style={styles.headerSubtitle}>Track your asset requests</Text>
      </LinearGradient>

      {/* Enhanced Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatCard({
            label: "Total",
            value: ticketStats.total,
            color: "#6366f1",
            icon: "list",
          })}
          {renderStatCard({
            label: "Pending",
            value: ticketStats.pending,
            color: "#f59e0b",
            icon: "clock-o",
          })}
        </View>
        <View style={styles.statsRow}>
          {renderStatCard({
            label: "Approved",
            value: ticketStats.approved + ticketStats.allocated,
            color: "#10b981",
            icon: "check-circle",
          })}
          {renderStatCard({
            label: "Others",
            value: ticketStats.rejected + ticketStats.cancelled,
            color: "#ef4444",
            icon: "times-circle",
          })}
        </View>
      </View>

      {/* Enhanced Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by category or status..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tickets List */}
      {ticketLoading && myTickets.length === 0 ? (
        <LoadingOverlay />
      ) : filteredTickets.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["rgba(0, 41, 87, 0.1)", "rgba(0, 41, 87, 0.05)"]}
            style={styles.emptyStateCard}
          >
            <FontAwesome name="ticket" size={64} color="rgba(0, 41, 87, 0.3)" />
            <Text style={styles.emptyStateTitle}>
              {myTickets.length === 0 ? "No Requests Yet" : "No Results Found"}
            </Text>
            <Text style={styles.emptyStateText}>
              {myTickets.length === 0
                ? "Raise your first asset request to get started"
                : "Try adjusting your search criteria"}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          // keyExtractor={(item) =>
          //   (item.id || item._id || Math.random()).toString()
          // }
          keyExtractor={(item, index) =>
            (item.id || item._id || index).toString()
          }
          contentContainerStyle={styles.ticketsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={ticketLoading}
              onRefresh={loadTickets}
              colors={["rgb(0, 41, 87)"]}
              tintColor="rgb(0, 41, 87)"
            />
          }
        />
      )}

      {/* Custom Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              width: "85%",
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Lottie Animation */}
            <View style={{ alignItems: "center" }}>
              <LottieView
                source={require("../../assets/animations/cancel.json")}
                autoPlay
                loop={false}
                style={{ width: 140, height: 140 }}
              />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "rgb(0, 41, 87)",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              Cancel Request?
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {ticketToCancel?.message}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#9CA3AF",
                  marginRight: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>
                  Close
                </Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={() => {
                  setCancelModalVisible(false);
                  if (cancelAction) cancelAction();
                }}
                style={{
                  flex: 1,
                  backgroundColor: "rgb(0, 41, 87)",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              width: "85%",
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              transform: [{ translateY: successSlideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Lottie Success Animation */}
            <View style={{ alignItems: "center" }}>
              <LottieView
                source={require("../../assets/animations/success.json")}
                autoPlay
                loop={false}
                style={{ width: 150, height: 150 }}
              />
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "rgb(0, 41, 87)",
                textAlign: "center",
                marginTop: -10,
              }}
            >
              Success
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {successMessage}
            </Text>

            {/* OK Button */}
            <TouchableOpacity
              onPress={() => setSuccessModalVisible(false)}
              style={{
                marginTop: 20,
                backgroundColor: "rgb(0, 41, 87)",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginBottom: 60,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 10,
    // paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    // marginTop: 8,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: "100%",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "rgba(0, 41, 87, 0.8)",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(0, 41, 87, 0.6)",
    textAlign: "center",
    lineHeight: 24,
  },
  ticketsList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  ticketCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ticketCardGradient: {
    padding: 14,
    backgroundColor: "white",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
    paddingRight: 12,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    // marginBottom: 10,
  },
  ticketCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  ticketRemark: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 12,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ticketDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  cancelButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  cancelButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "rgb(0, 41, 87)",
    fontWeight: "600",
  },
});
