// Screen/Asset/MyAssets.tsx
// Assets currently allocated to the logged-in user, as a grid or a list,
// with a detail sheet showing every field returned by /asset/myAssets.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyAssets, MyAsset } from "../../Services/AssetModule/myAssetsService";
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import {
  DeviceBadge,
  getDeviceTheme,
  HeroHeader,
  inferAssetType,
  PAGE_BG,
  PrimaryButton,
  ViewMode,
  ViewToggle,
} from "./AssetUI";

const VIEW_MODE_KEY = "myAssetsViewMode";
const GUTTER = 16;
const GRID_GAP = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 90;

// ---------- formatting helpers ----------

const isBlank = (value: any) =>
  value === null || value === undefined || String(value).trim() === "";

const formatDate = (iso: string | null) => {
  if (isBlank(iso)) return "";
  const date = new Date(iso as string);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const titleCase = (value: string) =>
  (value || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());

// Only fix values typed entirely in lower case ("dell", "noida");
// leave brand casing like "EPOS SENNHEISER" alone.
const tidy = (value: string) =>
  value && value === value.toLowerCase() ? titleCase(value) : value;

const formatSpan = (days: number) => {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return months > 0 ? `${years}y ${months}m` : `${years}y`;
  if (months > 0) return `${months}m`;
  return `${Math.max(days, 0)}d`;
};

type WarrantyInfo = {
  state: "active" | "expiring" | "expired" | "unknown";
  short: string;
  label: string;
  color: string;
  bg: string;
  icon: any;
  elapsed: number; // 0..1 share of the warranty period already used
};

const getWarranty = (asset: MyAsset): WarrantyInfo => {
  if (isBlank(asset.warrantyExpiredDate)) {
    return {
      state: "unknown",
      short: "No warranty info",
      label: "Warranty details not available",
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: "shield-off-outline",
      elapsed: 0,
    };
  }

  const now = Date.now();
  const expiry = new Date(asset.warrantyExpiredDate as string).getTime();
  const start = isBlank(asset.purchaseDate)
    ? now
    : new Date(asset.purchaseDate as string).getTime();
  const total = Math.max(expiry - start, 1);
  const elapsed = Math.min(Math.max((now - start) / total, 0), 1);
  const daysLeft = Math.ceil((expiry - now) / DAY_MS);

  if (daysLeft < 0) {
    return {
      state: "expired",
      short: "Warranty expired",
      label: `Expired ${formatSpan(-daysLeft)} ago`,
      color: "#B91C1C",
      bg: "#FEE2E2",
      icon: "shield-alert",
      elapsed: 1,
    };
  }
  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return {
      state: "expiring",
      short: `Expires in ${daysLeft}d`,
      label: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      color: "#92400E",
      bg: "#FEF3C7",
      icon: "shield-alert",
      elapsed,
    };
  }
  return {
    state: "active",
    short: `${formatSpan(daysLeft)} warranty`,
    label: `In warranty · ${formatSpan(daysLeft)} left`,
    color: "#166534",
    bg: "#DCFCE7",
    icon: "shield-check",
    elapsed,
  };
};

// ---------- small building blocks ----------

const WarrantyPill = ({ info }: { info: WarrantyInfo }) => (
  <View style={[styles.warrantyPill, { backgroundColor: info.bg }]}>
    <MaterialCommunityIcons name={info.icon} size={12} color={info.color} />
    <Text
      style={[styles.warrantyPillText, { color: info.color }]}
      numberOfLines={1}
    >
      {info.short}
    </Text>
  </View>
);

const AssetGridCard = ({
  asset,
  width,
  onPress,
}: {
  asset: MyAsset;
  width: number;
  onPress: () => void;
}) => {
  const type = inferAssetType(asset.code, asset.model);
  const theme = getDeviceTheme(type.category);
  const warranty = getWarranty(asset);

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
          size={84}
          color="rgba(255, 255, 255, 0.09)"
          style={styles.gridWatermark}
        />
        <View style={styles.glassIcon}>
          <MaterialCommunityIcons name={theme.icon} size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.gridType}>{type.label}</Text>
      </LinearGradient>

      <View style={styles.gridBody}>
        <Text style={styles.gridModel} numberOfLines={2}>
          {asset.model || "Unnamed asset"}
        </Text>
        <Text style={styles.gridMaker} numberOfLines={1}>
          {tidy(asset.manufacturer) || "—"}
        </Text>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText} numberOfLines={1}>
            {asset.code}
          </Text>
        </View>
        <WarrantyPill info={warranty} />
      </View>
    </TouchableOpacity>
  );
};

const AssetListRow = ({
  asset,
  onPress,
}: {
  asset: MyAsset;
  onPress: () => void;
}) => {
  const type = inferAssetType(asset.code, asset.model);
  const warranty = getWarranty(asset);
  const issued = formatDate(asset.issuedAt);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.listRow}
    >
      <DeviceBadge category={type.category} size={48} />
      <View style={styles.listInfo}>
        <Text style={styles.listModel} numberOfLines={1}>
          {asset.model || "Unnamed asset"}
        </Text>
        <Text style={styles.listMeta} numberOfLines={1}>
          {asset.code} · {type.label}
        </Text>
        <View style={styles.listFooter}>
          <WarrantyPill info={warranty} />
          {issued ? (
            <Text style={styles.listIssued} numberOfLines={1}>
              Issued {issued}
            </Text>
          ) : null}
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color="rgba(0, 41, 87, 0.3)"
      />
    </TouchableOpacity>
  );
};

// ---------- detail sheet ----------

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => {
  const empty = isBlank(value);
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons name={icon} size={16} color={BRAND.primary} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, empty && styles.detailValueEmpty]}
        selectable={!empty}
      >
        {empty ? "Not specified" : value}
      </Text>
    </View>
  );
};

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const AssetDetailSheet = ({
  asset,
  onClose,
}: {
  asset: MyAsset | null;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  // Keep the last asset rendered while the sheet animates out.
  const [shown, setShown] = useState<MyAsset | null>(null);

  useEffect(() => {
    if (asset) {
      setShown(asset);
      translateY.setValue(height);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 10,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [asset]);

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShown(null);
      onClose();
    });
  };

  if (!shown) return null;

  const type = inferAssetType(shown.code, shown.model);
  const theme = getDeviceTheme(type.category);
  const warranty = getWarranty(shown);
  const specs: [any, string, string][] = [
    ["cpu-64-bit", "Processor", shown.cpu],
    ["harddisk", "Storage", shown.hdd],
    ["memory", "Memory", shown.memory],
    ["microsoft-windows", "Operating system", shown.operatingSystem],
    ["puzzle-outline", "Accessories", shown.accessories],
  ];
  const hasSpecs = specs.some(([, , value]) => !isBlank(value));

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.sheetBackdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { maxHeight: height * 0.9, transform: [{ translateY }] },
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
            size={150}
            color="rgba(255, 255, 255, 0.08)"
            style={styles.sheetWatermark}
          />
          <View style={styles.sheetHandle} />

          <View style={styles.sheetTopRow}>
            <View style={[styles.glassIcon, styles.sheetGlassIcon]}>
              <MaterialCommunityIcons name={theme.icon} size={30} color="#FFFFFF" />
            </View>
            <TouchableOpacity
              onPress={close}
              style={styles.sheetClose}
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetType}>{type.label}</Text>
          <Text style={styles.sheetModel}>{shown.model || "Unnamed asset"}</Text>
          <View style={styles.sheetChips}>
            <View style={styles.sheetChip}>
              <MaterialCommunityIcons name="barcode" size={13} color="#FFFFFF" />
              <Text style={styles.sheetChipText}>{shown.code}</Text>
            </View>
            {!isBlank(shown.status) && (
              <View style={styles.sheetChip}>
                <View style={styles.statusDot} />
                <Text style={styles.sheetChipText}>{titleCase(shown.status)}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Warranty overview */}
          <View style={styles.warrantyCard}>
            <View style={styles.warrantyTop}>
              <View style={[styles.warrantyIcon, { backgroundColor: warranty.bg }]}>
                <MaterialCommunityIcons
                  name={warranty.icon}
                  size={20}
                  color={warranty.color}
                />
              </View>
              <View style={styles.warrantyText}>
                <Text style={styles.warrantyTitle}>{warranty.label}</Text>
                <Text style={styles.warrantySub}>
                  {warranty.state === "unknown"
                    ? "No purchase or expiry date recorded"
                    : `Valid till ${formatDate(shown.warrantyExpiredDate)}`}
                </Text>
              </View>
            </View>
            {warranty.state !== "unknown" && (
              <>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={
                      warranty.state === "active"
                        ? BRAND.primaryGradient
                        : [warranty.color, warranty.color]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(warranty.elapsed * 100, 4)}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>
                    {formatDate(shown.purchaseDate) || "Purchase date n/a"}
                  </Text>
                  <Text style={styles.progressLabel}>
                    {formatDate(shown.warrantyExpiredDate)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <DetailSection title="Identification">
            <DetailRow icon="barcode" label="Asset code" value={shown.code} />
            <DetailRow icon="identifier" label="Serial number" value={shown.serial} />
            <DetailRow icon="factory" label="Manufacturer" value={tidy(shown.manufacturer)} />
            <DetailRow icon="tag-outline" label="Model" value={shown.model} />
            <DetailRow icon="pound" label="Asset ID" value={String(shown.id ?? "")} />
          </DetailSection>

          <DetailSection title="Allocation">
            <DetailRow
              icon="check-decagram"
              label="Status"
              value={isBlank(shown.status) ? "" : titleCase(shown.status)}
            />
            <DetailRow icon="calendar-check" label="Issued on" value={formatDate(shown.issuedAt)} />
            <DetailRow icon="map-marker-outline" label="Location" value={titleCase(shown.location)} />
            <DetailRow icon="earth" label="Country" value={titleCase(shown.country)} />
          </DetailSection>

          <DetailSection title="Purchase & warranty">
            <DetailRow icon="store-outline" label="Vendor" value={tidy(shown.vendorName)} />
            <DetailRow icon="cart-outline" label="Purchase date" value={formatDate(shown.purchaseDate)} />
            <DetailRow
              icon="calendar-clock"
              label="Warranty expires"
              value={formatDate(shown.warrantyExpiredDate)}
            />
            <DetailRow
              icon="shield-check"
              label="Warranty / AMC status"
              value={shown.warrantyAmcStatus}
            />
          </DetailSection>

          <DetailSection title="Specifications">
            {hasSpecs ? (
              specs.map(([icon, label, value]) => (
                <DetailRow key={label} icon={icon} label={label} value={value} />
              ))
            ) : (
              <Text style={styles.emptyNote}>
                No specifications recorded for this asset.
              </Text>
            )}
          </DetailSection>

          <DetailSection title="Remarks">
            {isBlank(shown.remarks) ? (
              <Text style={styles.emptyNote}>No remarks.</Text>
            ) : (
              <Text style={styles.remarksText}>{shown.remarks}</Text>
            )}
          </DetailSection>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ---------- screen ----------

export default function MyAssets() {
  const { contentPaddingBottom } = useTabBarClearance();
  const { width } = useWindowDimensions();
  const gridCardWidth = (width - GUTTER * 2 - GRID_GAP) / 2;

  const [assets, setAssets] = useState<MyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<MyAsset | null>(null);

  const loadAssets = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getMyAssets();
      // Most recently issued first
      data.sort(
        (a, b) =>
          new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime()
      );
      setAssets(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load your assets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (saved === "grid" || saved === "list") setViewMode(saved);
      } catch {
        // Non-critical preference; fall back to grid.
      }
    })();
  }, [loadAssets]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_MODE_KEY, mode).catch(() => {});
  };

  const warranties = assets.map(getWarranty);
  const inWarranty = warranties.filter(
    (w) => w.state === "active" || w.state === "expiring"
  ).length;
  const expiringSoon = warranties.filter((w) => w.state === "expiring").length;

  const renderStat = (icon: any, value: number, label: string) => (
    <GlassSurface tone="dark" radius={14} style={styles.heroStat}>
      <MaterialCommunityIcons name={icon} size={16} color="#FFFFFF" />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel} numberOfLines={1}>
        {label}
      </Text>
    </GlassSurface>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.stateText}>Loading your assets...</Text>
        </View>
      );
    }

    if (error && assets.length === 0) {
      return (
        <View style={styles.centerState}>
          <View style={styles.stateIconRing}>
            <MaterialCommunityIcons name="cloud-alert" size={36} color={BRAND.primary} />
          </View>
          <Text style={styles.stateTitle}>Couldn't load assets</Text>
          <Text style={styles.stateText}>{error}</Text>
          <PrimaryButton
            label="Retry"
            onPress={() => loadAssets()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <FlatList
        key={viewMode} // numColumns can't change on a mounted list
        data={assets}
        keyExtractor={(item) => String(item.id ?? item.code)}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        renderItem={({ item }) =>
          viewMode === "grid" ? (
            <AssetGridCard
              asset={item}
              width={gridCardWidth}
              onPress={() => setSelected(item)}
            />
          ) : (
            <AssetListRow asset={item} onPress={() => setSelected(item)} />
          )
        }
        ListHeaderComponent={
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>Allocated devices</Text>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{assets.length}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <ViewToggle mode={viewMode} onChange={changeViewMode} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.stateIconRing}>
              <MaterialCommunityIcons
                name="package-variant"
                size={36}
                color={BRAND.primary}
              />
            </View>
            <Text style={styles.stateTitle}>No assets allocated</Text>
            <Text style={styles.stateText}>
              Devices issued to you will appear here.
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: contentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAssets(true)}
            colors={[BRAND.primary]}
            tintColor={BRAND.primary}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      <HeroHeader title="My Assets" subtitle="Devices currently allocated to you">
        <View style={styles.heroStats}>
          {renderStat("devices", assets.length, "Assigned")}
          {renderStat("shield-check", inWarranty, "In warranty")}
          {renderStat("shield-alert", expiringSoon, "Expiring")}
        </View>
      </HeroHeader>

      {renderBody()}

      <AssetDetailSheet asset={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  // Hero
  heroStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  heroStat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
  },

  // Toolbar
  listContent: {
    paddingHorizontal: GUTTER,
    paddingTop: 16,
    flexGrow: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
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
    color: BRAND.primary,
  },
  // Shared bits
  warrantyPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 1,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  warrantyPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    flexShrink: 1,
  },
  glassIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  codeChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: BRAND.primaryFaint,
    marginTop: 8,
    marginBottom: 8,
  },
  codeChipText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: BRAND.primary,
    letterSpacing: 0.4,
  },

  // Grid
  gridRow: {
    justifyContent: "space-between",
    marginBottom: GRID_GAP,
  },
  gridCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  gridHeader: {
    height: 92,
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  gridWatermark: {
    position: "absolute",
    right: -14,
    bottom: -18,
    transform: [{ rotate: "-12deg" }],
  },
  gridType: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gridBody: {
    padding: 12,
  },
  gridModel: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.ink,
    lineHeight: 18,
    minHeight: 36,
  },
  gridMaker: {
    fontSize: 12,
    color: BRAND.inkSoft,
    marginTop: 2,
  },

  // List
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 2,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  listModel: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  listMeta: {
    fontSize: 12,
    color: BRAND.inkSoft,
    marginTop: 2,
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  listIssued: {
    flexShrink: 1,
    fontSize: 11,
    color: BRAND.inkSoft,
  },

  // States
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 6,
  },
  stateIconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  stateText: {
    fontSize: 14,
    color: BRAND.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 150,
    marginTop: 14,
  },

  // Sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 22, 48, 0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PAGE_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    overflow: "hidden",
  },
  sheetWatermark: {
    position: "absolute",
    right: -24,
    bottom: -36,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetGlassIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
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
  sheetType: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 14,
  },
  sheetModel: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  sheetChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  sheetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  sheetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  sheetContent: {
    paddingHorizontal: GUTTER,
    paddingTop: 16,
  },

  // Warranty card
  warrantyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  warrantyTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  warrantyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  warrantyText: {
    flex: 1,
    marginLeft: 12,
  },
  warrantyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  warrantySub: {
    fontSize: 12,
    color: BRAND.inkSoft,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 41, 87, 0.08)",
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: BRAND.inkSoft,
  },

  // Detail sections
  section: {
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(0, 41, 87, 0.45)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 41, 87, 0.08)",
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: BRAND.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: BRAND.inkSoft,
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: BRAND.ink,
    textAlign: "right",
  },
  detailValueEmpty: {
    fontWeight: "400",
    fontStyle: "italic",
    color: "rgba(20, 33, 61, 0.35)",
  },
  emptyNote: {
    fontSize: 13,
    fontStyle: "italic",
    color: BRAND.inkSoft,
    paddingVertical: 12,
  },
  remarksText: {
    fontSize: 13.5,
    color: BRAND.ink,
    lineHeight: 20,
    paddingVertical: 12,
  },
});
