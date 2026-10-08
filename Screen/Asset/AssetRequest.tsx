// Screen/Asset/AssetRequest.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Animated,
  useWindowDimensions,
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
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import {
  AssetDialog,
  DeviceBadge,
  HeroHeader,
  PAGE_BG,
  PrimaryButton,
} from "./AssetUI";

const GRID_GUTTER = 16;
const GRID_GAP = 10;
const GRID_COLUMNS = 3;

type CategoryCardProps = {
  item: Category;
  index: number;
  width: number;
  isRaising: boolean;
  onPress: () => void;
};

// Grid card with a staggered entrance and a gentle press-in scale.
const CategoryCard = ({
  item,
  index,
  width,
  isRaising,
  onPress,
}: CategoryCardProps) => {
  const appear = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 10) * 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const pressTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={{
        width,
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
          { scale },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => pressTo(0.96)}
        onPressOut={() => pressTo(1)}
        disabled={isRaising}
        style={styles.categoryCard}
      >
        <View style={styles.addMark}>
          <FontAwesome name="plus" size={8} color={BRAND.primary} />
        </View>

        <DeviceBadge category={item.category} size={44} />

        <Text style={styles.categoryTitle} numberOfLines={2}>
          {item.category}
        </Text>

        {isRaising && (
          <View style={styles.raisingOverlay}>
            <ActivityIndicator size="small" color={BRAND.primary} />
            <Text style={styles.raisingText}>Raising…</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function AssetRequest() {
  const { contentPaddingBottom } = useTabBarClearance();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth =
    (windowWidth - GRID_GUTTER * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state
  const { assetCategories, assetLoading, raisingTicket, myTickets, ticketStats } =
    useSelector((state: any) => state);

  // Confirm Modal (Raise Request)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Success / Error Modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    console.log(" [AssetRequest] Component mounted");
    loadCategories();
  }, []);

  const showErrorAlert = (title: string, message: string) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
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
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => {
    const isRaising = raisingTicket === item.category;
    return (
      <CategoryCard
        item={item}
        index={index}
        width={cardWidth}
        isRaising={isRaising}
        onPress={() => !isRaising && handleRaiseTicket(item)}
      />
    );
  };

  if (assetLoading && assetCategories.length === 0) {
    return (
      <LinearGradient
        colors={BRAND.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingScreen}
      >
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
        <Text style={styles.loadingTitle}>Loading asset categories</Text>
        <Text style={styles.loadingSubtitle}>Just a moment…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      <HeroHeader
        title="Request an Asset"
        subtitle="Select an asset category to raise a request"
      >
        <View style={styles.heroStats}>
          <GlassSurface tone="dark" radius={14} style={styles.heroStat}>
            <FontAwesome name="th-large" size={13} color="#FFFFFF" />
            <Text style={styles.heroStatValue}>{assetCategories.length}</Text>
            <Text style={styles.heroStatLabel}>Categories</Text>
          </GlassSurface>
          <GlassSurface tone="dark" radius={14} style={styles.heroStat}>
            <FontAwesome name="clock-o" size={13} color="#FFFFFF" />
            <Text style={styles.heroStatValue}>{ticketStats?.pending ?? 0}</Text>
            <Text style={styles.heroStatLabel}>Pending</Text>
          </GlassSurface>
        </View>
      </HeroHeader>

      {/* Categories Grid */}
      {assetCategories.length === 0 && !assetLoading ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <FontAwesome name="cube" size={36} color={BRAND.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>No Categories Available</Text>
          <Text style={styles.emptyStateText}>
            No asset categories are available for request at this time.
          </Text>
          <PrimaryButton
            label="Retry"
            icon="refresh"
            onPress={refreshCategories}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={assetCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) =>
            item._id || item.id?.toString() || item.category
          }
          numColumns={GRID_COLUMNS}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available categories</Text>
              <Text style={styles.sectionHint}>Tap a device to request</Text>
            </View>
          }
          contentContainerStyle={[
            styles.categoriesContainer,
            { paddingBottom: contentPaddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      )}

      <AssetDialog
        visible={confirmModalVisible}
        variant="confirm"
        title={confirmTitle}
        message={confirmMessage}
        secondaryLabel="Close"
        onSecondary={() => setConfirmModalVisible(false)}
        primaryLabel="Continue"
        onPrimary={() => {
          setConfirmModalVisible(false);
          if (confirmAction) confirmAction();
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

      <AssetDialog
        visible={errorModalVisible}
        variant="error"
        title="Error"
        message={errorMessage}
        primaryLabel="OK"
        onPrimary={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  // Hero stats
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  heroStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginLeft: 6,
  },

  // Grid
  categoriesContainer: {
    paddingHorizontal: GRID_GUTTER,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  sectionHint: {
    fontSize: 12,
    color: BRAND.inkSoft,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: GRID_GAP,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    overflow: "hidden",
    elevation: 2,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  addMark: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: BRAND.ink,
    textAlign: "center",
    lineHeight: 15,
    minHeight: 30,
    marginTop: 10,
    textAlignVertical: "center",
  },
  raisingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  raisingText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND.primary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.ink,
    marginTop: 18,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: BRAND.inkSoft,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },
  retryButton: {
    minWidth: 150,
  },

  // Loading
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
});
