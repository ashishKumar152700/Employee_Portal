

// Screen/Asset/AssetRequest.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import {
  Category,
  getCategoriesByRole,
  raiseTicket,
  calculateTicketStats,
} from "../../Services/AssetModule/ticketService";
import { Modal, Animated, Easing } from "react-native";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const iconConfig: {
    [key: string]: { icon: string; color: string; gradient: string[] };
  } = {
    MOUSE: {
      icon: "hand-pointer-o",
      color: "#4A90E2",
      gradient: ["white", "white"],
    },
    KEYBOARD: {
      icon: "keyboard-o",
      color: "#50C878",
      gradient: ["white", "white"],
    },
    LAPTOP: { icon: "laptop", color: "#FF6B35", gradient: ["white", "white"] },
    MONITOR: {
      icon: "desktop",
      color: "#9B59B6",
      gradient: ["white", "white"],
    },
    "STORAGE DEVICE": {
      icon: "hdd-o",
      color: "#E67E22",
      gradient: ["white", "white"],
    },
    HEADPHONE: {
      icon: "headphones",
      color: "#E74C3C",
      gradient: ["white", "white"],
    },
    BIOMETRIC: {
      icon: "fingerprint",
      color: "#2ECC71",
      gradient: ["white", "white"],
    },
    PRINTER: { icon: "print", color: "#34495E", gradient: ["white", "white"] },
    DOCKSTATION: {
      icon: "plug",
      color: "#8E44AD",
      gradient: ["white", "white"],
    },
    "DOCK STATION": {
      icon: "plug",
      color: "#8E44AD",
      gradient: ["white", "white"],
    },
    "LAPTOP CHARGER": {
      icon: "battery-3",
      color: "#F39C12",
      gradient: ["white", "white"],
    },
    PENDRIVE: { icon: "usb", color: "#3498DB", gradient: ["white", "white"] },
    "PEN DRIVE": {
      icon: "usb",
      color: "#3498DB",
      gradient: ["white", "white"],
    },
    SERVER: { icon: "server", color: "#1ABC9C", gradient: ["white", "white"] },
    HARDDISK: { icon: "hdd-o", color: "#7F8C8D", gradient: ["white", "white"] },
    "HARD DISK": {
      icon: "hdd-o",
      color: "#7F8C8D",
      gradient: ["white", "white"],
    },
    "LAPTOP BAG": {
      icon: "briefcase",
      color: "#D35400",
      gradient: ["white", "white"],
    },
    "TIME ATTENDANCE MACHINE": {
      icon: "clock-o",
      color: "#2C3E50",
      gradient: ["white", "white"],
    },
  };

  return (
    iconConfig[category.toUpperCase()] || {
      icon: "desktop",
      color: "#95A5A6",
      gradient: ["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.8)"],
    }
  );
};

export default function AssetRequest() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state
  const { assetCategories, assetLoading, raisingTicket, myTickets } =
    useSelector((state: any) => state);

  // Confirm Modal (Raise Request)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const confirmSlideAnim = useRef(new Animated.Value(300)).current;

  // Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successSlideAnim = useRef(new Animated.Value(300)).current;
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const errorSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    console.log(" [AssetRequest] Component mounted");
    loadCategories();
  }, []);

  const ConfirmAnimation = () => {
  const scale = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
        width: 100,
        height: 100,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: "rgb(0,41,87)",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        marginBottom : 10
      }}
    >
      <View
        style={{
          width: 10,
          height: 30,
          borderRadius: 5,
          backgroundColor: "rgb(0,41,87)",
          marginBottom: 5
        }}
      />
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 9,
          backgroundColor: "rgb(0,41,87)"
        }}
      />
    </Animated.View>
  );
};

  const showErrorAlert = (title: string, message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);

    Animated.timing(errorSlideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const loadCategories = async () => {
    if (assetCategories.length > 0) {
      console.log(" [AssetRequest] Using cached categories");
      return;
    }

    console.log(" [AssetRequest] Loading categories from API");
    dispatch({ type: "SET_ASSET_LOADING", payload: true });

    try {
      const categoriesData = await getCategoriesByRole();
      dispatch({ type: "SET_ASSET_CATEGORIES", payload: categoriesData });
      console.log(" [AssetRequest] Categories loaded:", categoriesData.length);
    } catch (error) {
      console.error(" [AssetRequest] Error loading categories:", error);
      showErrorAlert(
        "Error",
        error.message || "Failed to raise request. Please try again."
      );
    } finally {
      dispatch({ type: "SET_ASSET_LOADING", payload: false });
    }
  };

  const handleRaiseTicket = async (category: Category) => {
    showConfirmAlert(
      "Raise Asset Request",
      `Do you want to raise a request for ${category.category}?`,
      async () => {
        dispatch({ type: "SET_RAISING_TICKET", payload: category.category });

        try {
          console.log(" [AssetRequest] Raising ticket for:", category.category);
          await raiseTicket([category.category]);

          // Add optimistic update to Redux store
          const newTicket = {
            id: Date.now(), // Temporary ID
            category: category.category,
            status: "Waiting for approval by manager",
            ticketRaisedOn: new Date().toISOString(),
            remark: null,
          };
          dispatch({ type: "ADD_TICKET", payload: newTicket });

          // Update stats
          const updatedStats = calculateTicketStats([...myTickets, newTicket]);
          dispatch({ type: "SET_TICKET_STATS", payload: updatedStats });

          showSuccessAlert("Success", "Asset request raised successfully!");

        //   navigation.navigate("MyTickets");
        } catch (error: any) {
          console.error(" [AssetRequest] Error raising ticket:", error);
          if (error.message && error.message.includes("JSON Parse")) {
            // Handle JSON parse error as success
            const newTicket = {
              id: Date.now(),
              category: category.category,
              status: "Waiting for approval by manager",
              ticketRaisedOn: new Date().toISOString(),
              remark: null,
            };
            dispatch({ type: "ADD_TICKET", payload: newTicket });
            const updatedStats = calculateTicketStats([
              ...myTickets,
              newTicket,
            ]);
            dispatch({ type: "SET_TICKET_STATS", payload: updatedStats });

            showErrorAlert(
              "Error",
              error.message || "Failed to raise request. Please try again."
            );

            // navigation.navigate("MyTickets");
          } else {
            showErrorAlert(
              "Error",
              error.message || "Failed to raise request. Please try again."
            );
          }
        } finally {
          dispatch({ type: "SET_RAISING_TICKET", payload: null });
        }
      }
    );
  };

  const refreshCategories = async () => {
    console.log(" [AssetRequest] Refreshing categories");
    dispatch({ type: "SET_ASSET_CATEGORIES", payload: [] });
    await loadCategories();
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

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);

    setConfirmModalVisible(true);

    Animated.timing(confirmSlideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => {
    const iconConfig = getCategoryIcon(item.category);
    const isRaising = raisingTicket === item.category;

    return (
      <TouchableOpacity
        style={[styles.categoryCard, { opacity: isRaising ? 0.7 : 1 }]}
        onPress={() => !isRaising && handleRaiseTicket(item)}
        disabled={isRaising}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={iconConfig.gradient}
          style={styles.categoryHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isRaising ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Raising Request...</Text>
            </View>
          ) : (
            <FontAwesome
              name={iconConfig.icon}
              size={35}
              color="rgb(0, 41, 87)"
              style={styles.categoryIcon}
            />
          )}
        </LinearGradient>

        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{item.category}</Text>
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor: `${iconConfig.color}15`,
                borderColor: `${iconConfig.color}30`,
              },
            ]}
          >
            <FontAwesome
              name="hand-paper-o"
              size={12}
              color={iconConfig.color}
            />
            <Text style={[styles.actionText, { color: iconConfig.color }]}>
              {isRaising ? "Processing..." : "Tap to Request"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={["rgba(0,41,87,0.9)", "rgba(0,41,87,0.7)"]}
        style={styles.loadingGradient}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.overlayLoadingText}>
          Loading Asset Categories...
        </Text>
      </LinearGradient>
    </View>
  );

  if (assetLoading && assetCategories.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      {/* Enhanced Header */}
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.8)"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* <FontAwesome name="cube" size={28} color="white"/>
                    <Text style={styles.headerTitle}>Asset Request</Text> */}
          <Text style={styles.headerSubtitle}>
            Select an asset category to raise a request
          </Text>
        </View>
      </LinearGradient>

      {/* Categories Grid */}
      {assetCategories.length === 0 && !assetLoading ? (
        <View style={styles.emptyState}>
          <FontAwesome name="cube" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Categories Available</Text>
          <Text style={styles.emptyStateText}>
            No asset categories are available for request at this time.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshCategories}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={assetCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) =>
            item._id || item.id?.toString() || item.category
          }
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}

        />
      )}

{confirmModalVisible && (
  <Modal visible transparent animationType="none">
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalCard, { transform: [{ translateY: confirmSlideAnim }] }]}>

        {/* Confirm Animation (NO LOTTIE) */}
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <ConfirmAnimation />
        </View>

        <Text style={styles.modalTitle}>{confirmTitle}</Text>
        <Text style={styles.modalMessage}>{confirmMessage}</Text>

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setConfirmModalVisible(false)}>
            <Text style={styles.btnCancelText}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={() => {
              setConfirmModalVisible(false);
              if (confirmAction) confirmAction();
            }}
          >
            <Text style={styles.btnConfirmText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  </Modal>
)}

{/* Success Modal */}
{successModalVisible && (
  <Modal visible transparent animationType="none">
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalCard, { transform: [{ translateY: successSlideAnim }] }]}>
        <LottieView
          source={require("../../assets/animations/success.json")}
          autoPlay
          loop={false}
          style={styles.lottieStyle}
        />
        <Text style={styles.modalTitle}>Success</Text>
        <Text style={styles.modalMessage}>{successMessage}</Text>

        <TouchableOpacity style={styles.btnConfirm} onPress={() => setSuccessModalVisible(false)}>
          <Text style={styles.btnConfirmText}>OK</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>
)}

{/* Error Modal */}
{errorModalVisible && (
  <Modal visible transparent animationType="none">
    <View style={styles.modalOverlay}>
      <Animated.View style={[styles.modalCard, { transform: [{ translateY: errorSlideAnim }] }]}>
        <LottieView
          source={require("../../assets/animations/error.json")}
          autoPlay
          loop={false}
          style={styles.lottieStyle}
        />
        <Text style={styles.modalTitle}>Error</Text>
        <Text style={styles.modalMessage}>{errorMessage}</Text>

        <TouchableOpacity style={styles.btnConfirm} onPress={() => setErrorModalVisible(false)}>
          <Text style={styles.btnConfirmText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>
)}

     <Modal visible={successModalVisible} transparent animationType="none">
  <View style={styles.modalOverlay}>
    <Animated.View
      style={[
        styles.modalCard,
        {
          transform: [{ translateY: successSlideAnim }],
        },
      ]}
    >
      {/* Lottie Success Animation */}
      <View style={{ alignItems: 'center' }}>
        <LottieView
          source={require('../../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>

      <Text style={{ fontSize: 18, fontWeight: '700', color: 'rgb(0, 41, 87)', textAlign: 'center' }}>
        Success
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 5 }}>
        {successMessage}
      </Text>

      <TouchableOpacity
        onPress={() => setSuccessModalVisible(false)}
        style={{ marginTop: 20, backgroundColor: 'rgb(0, 41, 87)', padding: 12, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>OK</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>

{/* ERROR MODAL - FIXED */}
<Modal visible={errorModalVisible} transparent animationType="none">
  <View style={styles.modalOverlay}>
    <Animated.View
      style={[
        styles.modalCard,
        {
          transform: [{ translateY: errorSlideAnim }],
        },
      ]}
    >
      {/* Lottie Error Animation */}
      <View style={{ alignItems: 'center' }}>
        <LottieView
          source={require('../../assets/animations/error.json')}
          autoPlay
          loop={false}
          style={{ width: 150, height: 150 }}
        />
      </View>

      <Text style={{ fontSize: 20, fontWeight: '700', color: 'rgb(0, 41, 87)', textAlign: 'center', marginTop: -10 }}>
        Error
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>
        {errorMessage}
      </Text>

      {/* OK Button */}
      <TouchableOpacity
        onPress={() => setErrorModalVisible(false)}
        style={{ marginTop: 20, backgroundColor: 'rgb(0, 41, 87)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', width: '100%' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>OK</Text>
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
    marginBottom: 65,
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    // marginTop: 8,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 12,
  },
  myTicketsButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  myTicketsGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  myTicketsText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  badge: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  categoriesContainer: {
    padding: 18,
    paddingTop: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  categoryCard: {
    width: (width - 50) / 2,
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  categoryHeader: {
    // backgroundColor :  'rgb(0, 41, 87)',
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  categoryIcon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  categoryContent: {
    padding: 20,
    alignItems: "center",
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "rgb(0, 41, 87)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    // backgroundColor: 'white',
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    // borderTopColor: '#e5e7eb',
    borderTopColor: "rgba(229, 231, 235, 0.3)",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(0,41,87,0.6)",
    fontStyle: "italic",
    opacity: 60,
  },
  loadingOverlay: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  overlayLoadingText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  modalOverlay: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
},
modalCard: {
  width: "85%",
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 20,
  alignItems: "center",
  elevation: 10,
},
lottieStyle: {
  width: 150,
  height: 150,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "rgb(0,41,87)",
  marginTop: -5,
  textAlign: "center",
},
modalMessage: {
  fontSize: 14,
  color: "#6B7280",
  textAlign: "center",
  marginTop: 5,
},
modalButtons: {
  width: "100%",
  flexDirection: "row",
  marginTop: 20,
},
btnCancel: {
  flex: 1,
  padding: 12,
  borderWidth: 1,
  borderColor: "#9CA3AF",
  borderRadius: 12,
  marginRight: 8,
  alignItems: "center",
},
btnCancelText: {
  color: "#374151",
  fontWeight: "600",
},
btnConfirm: {
  flex: 1,
  padding: 12,
  backgroundColor: "rgb(0,41,87)",
  borderRadius: 12,
  alignItems: "center",
},
btnConfirmText: {
  color: "#fff",
  fontWeight: "700",
},

});
