import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    FlatList,
    View,
    Text,
    Alert,
    Modal,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Easing,
    TouchableOpacity,
    Dimensions,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { leaveHistoryPending } from "../../Services/Leave/Leave.service";
import { managerLeaveRequestClass } from "../../Services/LeaveRequest/LeaveRequest.service";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const Tab = createBottomTabNavigator();

const PRIMARY = "#002957";
const PRIMARY_LIGHT = "#0A4A8F";
const ACCENT = "#3D7CC9";
const BG = "#F4F7FB";
const DANGER = "#E5484D";
const DANGER_DARK = "#B3261E";

const BURN_DURATION = 900;
const EMBER_COUNT = 18;
const EMBER_COLORS = ["#FFD580", "#FF8C00", "#FF5A1F", "#FFC24B", "#FF3D00"];

// NOTE: Drop a free "warning / alert" Lottie JSON from lottiefiles.com into
// this path (or point it at your own asset). Any circular alert/question-mark
// animation with a transparent background will match the theme nicely.
const CANCEL_LOTTIE_SOURCE = require("../../assets/animations/error.json");

const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
};

/* Embers that spawn along the burn front and rise off the card */
const createEmbers = () =>
    Array.from({ length: EMBER_COUNT }).map(() => {
        const triggerFrac = Math.random() * 0.82; // when along the burn this ember ignites
        return {
            anim: new Animated.Value(0),
            left: `${4 + Math.random() * 92}%`,
            bottomStart: triggerFrac * 96, // roughly tracks the flame front height at ignition
            rise: 30 + Math.random() * 70,
            drift: (Math.random() - 0.5) * 36,
            size: 2.5 + Math.random() * 4.5,
            color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
            duration: 450 + Math.random() * 500,
            delay: triggerFrac * BURN_DURATION,
        };
    });

/* ---------------------------------------------------------
   Cancel Confirmation Modal
   - Lottie animation header
   - Theme-matched card, spring entrance, faded backdrop
--------------------------------------------------------- */
const CancelConfirmModal = ({ visible, onCancel, onConfirm }) => {
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.85)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const [rendered, setRendered] = useState(visible);

    useEffect(() => {
        if (visible) {
            setRendered(true);
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.spring(cardScale, {
                    toValue: 1,
                    speed: 16,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 260,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cardScale, {
                    toValue: 0.9,
                    duration: 180,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) setRendered(false);
            });
        }
    }, [visible]);

    if (!rendered) return null;

    return (
        <Modal
            transparent
            visible={rendered}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onCancel}
                />

                <Animated.View
                    style={[
                        styles.modalCard,
                        {
                            opacity: cardOpacity,
                            transform: [{ scale: cardScale }],
                        },
                    ]}
                >
                    <View style={styles.modalLottieWrap}>
                        <LottieView
                            source={CANCEL_LOTTIE_SOURCE}
                            autoPlay
                            loop
                            style={styles.modalLottie}
                        />
                    </View>

                    <Text style={styles.modalTitle}>Cancel Leave Request?</Text>
                    <Text style={styles.modalSubtitle}>
                        This action can’t be undone. Your pending leave request will be
                        withdrawn immediately.
                    </Text>

                    <View style={styles.modalButtonRow}>
                        <TouchableOpacity
                            style={styles.modalKeepButton}
                            activeOpacity={0.8}
                            onPress={onCancel}
                        >
                            <Text style={styles.modalKeepButtonText}>No, Keep It</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalConfirmButtonWrap}
                            activeOpacity={0.85}
                            onPress={onConfirm}
                        >
                            <LinearGradient
                                colors={[DANGER, DANGER_DARK]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.modalConfirmButton}
                            >
                                <Icon name="times-circle" size={15} color="#FFFFFF" />
                                <Text style={styles.modalConfirmButtonText}>Yes, Cancel</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

/* ---------------------------------------------------------
   Animated Leave Card
   - staggered entrance
   - symmetric grid
   - gradient cancel button
   - burning-paper exit with rising embers
--------------------------------------------------------- */
const LeaveCard = ({
                       item,
                       leaveType,
                       index,
                       isExiting,
                       onExitComplete,
                       onConfirmCancel,
                   }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;
    const burnAnim = useRef(new Animated.Value(0)).current;
    const flicker = useRef(new Animated.Value(1)).current;
    const postBurnFade = useRef(new Animated.Value(1)).current;
    const embers = useRef(createEmbers()).current;
    const itemRef = useRef(item);
    itemRef.current = item;

    const [confirmVisible, setConfirmVisible] = useState(false);

    const isCancelable = leaveType === "pending";

    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1,
            duration: 450,
            delay: Math.min(index * 70, 500),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, []);

    // Trigger the burn sequence once the parent flags this card as exiting
    useEffect(() => {
        if (!isExiting) return;

        const flickerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(flicker, {
                    toValue: 0.6,
                    duration: 90,
                    useNativeDriver: true,
                }),
                Animated.timing(flicker, {
                    toValue: 1,
                    duration: 110,
                    useNativeDriver: true,
                }),
            ])
        );
        flickerLoop.start();

        Animated.parallel([
            Animated.sequence([
                Animated.timing(burnAnim, {
                    toValue: 1,
                    duration: BURN_DURATION,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.delay(150),
                Animated.timing(postBurnFade, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            ...embers.map((e) =>
                Animated.timing(e.anim, {
                    toValue: 1,
                    duration: e.duration,
                    delay: e.delay,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            ),
        ]).start(({ finished }) => {
            flickerLoop.stop();
            if (finished) onExitComplete(item.id);
        });
    }, [isExiting]);

    const requestCancel = () => {
        setConfirmVisible(true);
    };

    const handleDismissConfirm = () => setConfirmVisible(false);

    const handleConfirmCancel = () => {
        setConfirmVisible(false);
        onConfirmCancel(itemRef.current);
    };

    const indicatorColor =
        leaveType === "pending"
            ? "#F5A623"
            : leaveType === "approved"
                ? "#2BAE66"
                : "#E5484D";

    const badgeStyle =
        leaveType === "pending"
            ? styles.pendingBadge
            : leaveType === "approved"
                ? styles.approvedBadge
                : styles.rejectedBadge;

    const badgeTextColor =
        leaveType === "pending"
            ? "#8A5A00"
            : leaveType === "approved"
                ? "#1B7A43"
                : "#B3261E";

    const statusIcon =
        leaveType === "approved"
            ? "check-circle"
            : leaveType === "declined"
                ? "times-circle"
                : "clock-o";

    const entranceTranslateY = cardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [24, 0],
    });
    const combinedOpacity = Animated.multiply(cardAnim, postBurnFade);
    const combinedScale = Animated.multiply(
        pressAnim,
        postBurnFade.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] })
    );
    const charHeight = burnAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 40,
            bounciness: 4,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 4,
        }).start();
    };

    return (
        <>
            <Animated.View
                style={{
                    marginHorizontal: 16,
                    marginVertical: 8,
                    opacity: combinedOpacity,
                    transform: [{ translateY: entranceTranslateY }, { scale: combinedScale }],
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    style={styles.card}
                >
                    <View style={[styles.accentRail, { backgroundColor: indicatorColor }]} />

                    <View style={styles.cardBody}>
                        {/* Header row */}
                        <View style={styles.cardHeader}>
                            <View style={styles.titleBlock}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {item.leavetype}
                                </Text>
                                <View style={styles.appliedRow}>
                                    <Icon name="calendar-plus-o" size={12} color="#8A96A3" />
                                    <Text style={styles.appliedText}>
                                        Applied {formatDate(item.applydate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.statusTag, badgeStyle]}>
                                <Icon name={statusIcon} size={12} color={badgeTextColor} />
                                <Text style={[styles.statusTagText, { color: badgeTextColor }]}>
                                    {(item.leavestatus || leaveType).toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Symmetric 2-column date grid */}
                        <View style={styles.grid}>
                            <View style={styles.gridCol}>
                                <Text style={styles.gridLabel}>FROM</Text>
                                <View style={styles.gridValueRow}>
                                    <Icon name="calendar" size={13} color={PRIMARY} />
                                    <Text style={styles.gridValue}>{formatDate(item.leavestart)}</Text>
                                </View>
                            </View>

                            <View style={styles.gridDivider} />

                            <View style={styles.gridCol}>
                                <Text style={styles.gridLabel}>TO</Text>
                                <View style={styles.gridValueRow}>
                                    <Icon name="calendar" size={13} color={PRIMARY} />
                                    <Text style={styles.gridValue}>{formatDate(item.leaveend)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.grid}>
                            <View style={styles.gridCol}>
                                <Text style={styles.gridLabel}>DAY TYPE</Text>
                                <View style={styles.gridValueRow}>
                                    <Icon name="clock-o" size={13} color={PRIMARY} />
                                    <Text style={styles.gridValue}>{item.leavepart}</Text>
                                </View>
                            </View>

                            <View style={styles.gridDivider} />

                            <View style={styles.gridCol}>
                                <Text style={styles.gridLabel}>STATUS</Text>
                                <View style={styles.gridValueRow}>
                                    <View style={[styles.miniDot, { backgroundColor: indicatorColor }]} />
                                    <Text style={styles.gridValue}>{item.leavestatus || leaveType}</Text>
                                </View>
                            </View>
                        </View>

                        {!!item.reason && (
                            <View style={styles.reasonBox}>
                                <Icon name="commenting-o" size={13} color="#8A96A3" />
                                <Text style={styles.reasonText} numberOfLines={3}>
                                    {item.reason}
                                </Text>
                            </View>
                        )}

                        {isCancelable && (
                            <TouchableOpacity
                                onPress={requestCancel}
                                activeOpacity={0.85}
                                style={styles.cancelButtonWrap}
                            >
                                <LinearGradient
                                    colors={[DANGER, DANGER_DARK]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cancelButton}
                                >
                                    <Icon name="times-circle" size={16} color="#FFFFFF" />
                                    <Text style={styles.cancelButtonText}>Cancel Leave</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Burning-paper overlay, clipped by the card's rounded corners */}
                    {isExiting && (
                        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                            <Animated.View style={[styles.charLayer, { height: charHeight }]}>
                                <LinearGradient
                                    colors={["#FF6A00", "#FFD580"]}
                                    style={StyleSheet.absoluteFill}
                                />

                                {/* Glowing flame front riding the char boundary */}
                                <Animated.View style={[styles.flameBar, { opacity: flicker }]}>
                                    <LinearGradient
                                        colors={[
                                            "rgba(255,140,0,0)",
                                            "#FFD580",
                                            "#FF6A00",
                                            "#FF3D00",
                                            "rgba(255,61,0,0)",
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.flameGradient}
                                    />
                                </Animated.View>

                                {/* Embers rising off the flame front */}
                                {embers.map((e, i) => (
                                    <Animated.View
                                        key={i}
                                        style={{
                                            position: "absolute",
                                            left: e.left,
                                            bottom: `${e.bottomStart}%`,
                                            width: e.size,
                                            height: e.size,
                                            borderRadius: e.size,
                                            backgroundColor: e.color,
                                            shadowColor: e.color,
                                            shadowOpacity: 0.9,
                                            shadowRadius: 4,
                                            opacity: e.anim.interpolate({
                                                inputRange: [0, 0.12, 0.7, 1],
                                                outputRange: [0, 1, 0.9, 0],
                                            }),
                                            transform: [
                                                {
                                                    translateY: e.anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, -e.rise],
                                                    }),
                                                },
                                                {
                                                    translateX: e.anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, e.drift],
                                                    }),
                                                },
                                            ],
                                        }}
                                    />
                                ))}
                            </Animated.View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            <CancelConfirmModal
                visible={confirmVisible}
                onCancel={handleDismissConfirm}
                onConfirm={handleConfirmCancel}
            />
        </>
    );
};

/* ---------------------------------------------------------
   Leave route (list per tab)
--------------------------------------------------------- */
const LeaveRoute = ({ leaveType, navigation }) => {
    const [leaveData, setLeaveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [exitingIds, setExitingIds] = useState([]);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const runAnimations = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const confirmCancel = useCallback(async (leave) => {
        try {
            await managerLeaveRequestClass.LeaveStatusUpdate(leave.id, "cancel");
            setExitingIds((prev) => [...prev, leave.id]);
        } catch (err) {
            Alert.alert("Error", "Unable to cancel leave.");
        }
    }, []);

    const finalizeRemoval = useCallback((id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLeaveData((prev) => prev.filter((i) => i.id !== id));
        setExitingIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const fetchLeaveData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            setError(null);
            const response = await leaveHistoryPending(leaveType);
            if (response.status === 200) {
                setLeaveData(response.data.data);
            } else {
                setError("Failed to fetch data");
            }
        } catch (err) {
            setError("Error fetching data");
        } finally {
            setLoading(false);
            setRefreshing(false);
            runAnimations();
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaveData(true);
    }, []);

    useEffect(() => {
        fetchLeaveData();
    }, [leaveType]);

    if (loading && !refreshing) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loaderText}>Loading records…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIconWrap}>
                    <Icon name="exclamation-triangle" size={36} color="#E5484D" />
                </View>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => fetchLeaveData()}
                    activeOpacity={0.85}
                >
                    <Icon name="refresh" size={14} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return leaveData.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconWrap}>
                <Icon name="inbox" size={48} color="#B9C4D0" />
            </View>
            <Text style={styles.emptyText}>No leave records available</Text>
            <Text style={styles.emptySubText}>
                Records for this category will show up here
            </Text>
        </Animated.View>
    ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <FlatList
                data={leaveData}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[PRIMARY]}
                        tintColor={PRIMARY}
                    />
                }
                contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
                renderItem={({ item, index }) => (
                    <LeaveCard
                        item={item}
                        leaveType={leaveType}
                        index={index}
                        isExiting={exitingIds.includes(item.id)}
                        onExitComplete={finalizeRemoval}
                        onConfirmCancel={confirmCancel}
                    />
                )}
            />
        </Animated.View>
    );
};

/* ---------------------------------------------------------
   Header
--------------------------------------------------------- */
const LeaveHistoryHeader = ({ navigation }) => (
    <LinearGradient
        colors={[PRIMARY, PRIMARY_LIGHT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
    >
        <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Leave History</Text>
            <Text style={styles.headerSubtitle}>Track your applications</Text>
        </View>
        <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <Icon name="times" size={18} color="#fff" />
        </TouchableOpacity>
    </LinearGradient>
);

/* ---------------------------------------------------------
   Custom animated bottom tab bar
   Selected tab: solid blue pill, white bold icon + text
--------------------------------------------------------- */
const TAB_CONFIG = {
    Pending: { icon: "clock-o", label: "Pending" },
    Approved: { icon: "check", label: "Approved" },
    Declined: { icon: "times", label: "Declined" },
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const animatedValues = useRef(
        state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))
    ).current;

    useEffect(() => {
        state.routes.forEach((_, i) => {
            Animated.timing(animatedValues[i], {
                toValue: i === state.index ? 1 : 0,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        });
    }, [state.index]);

    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const config = TAB_CONFIG[route.name] || {
                    icon: "circle",
                    label: route.name,
                };

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const animatedValue = animatedValues[index];

                const backgroundColor = animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["rgba(0,41,87,0)", PRIMARY],
                });

                const scale = animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                });

                const iconColor = isFocused ? "#FFFFFF" : "#8A96A3";
                const textColor = isFocused ? "#FFFFFF" : "#8A96A3";

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        activeOpacity={0.85}
                        style={styles.tabItemWrap}
                    >
                        <Animated.View
                            style={[
                                styles.tabItem,
                                {
                                    backgroundColor,
                                    transform: [{ scale }],
                                },
                            ]}
                        >
                            <Icon name={config.icon} size={17} color={iconColor} />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    {
                                        color: textColor,
                                        fontWeight: isFocused ? "700" : "500",
                                    },
                                ]}
                            >
                                {config.label}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

/* ---------------------------------------------------------
   Navigator
--------------------------------------------------------- */
export default function LeaveTabNavigator({ navigation }) {
    return (
        <View style={styles.container}>
            <LeaveHistoryHeader navigation={navigation} />

            <Tab.Navigator
                tabBar={(props) => <CustomTabBar {...props} />}
                screenOptions={{ headerShown: false }}
            >
                <Tab.Screen name="Pending">
                    {() => <LeaveRoute leaveType="pending" navigation={navigation} />}
                </Tab.Screen>

                <Tab.Screen name="Approved">
                    {() => <LeaveRoute leaveType="approved" navigation={navigation} />}
                </Tab.Screen>

                <Tab.Screen name="Declined">
                    {() => <LeaveRoute leaveType="declined" navigation={navigation} />}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    /* Header */
    headerContainer: {
        paddingTop: 18,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTextWrap: { flex: 1 },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.2,
    },
    headerSubtitle: {
        fontSize: 12.5,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
        fontWeight: "500",
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },

    /* Loader / Error / Empty */
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loaderText: { marginTop: 10, color: "#8A96A3", fontSize: 13, fontWeight: "500" },

    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    errorIconWrap: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#FDEDED",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    errorText: { fontSize: 14, color: "#495057", fontWeight: "600", textAlign: "center" },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: PRIMARY,
        paddingVertical: 11,
        paddingHorizontal: 22,
        borderRadius: 24,
        marginTop: 16,
        gap: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    retryButtonText: { color: "#fff", fontWeight: "700", fontSize: 13.5 },

    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
    emptyIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#EEF2F7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyText: { fontSize: 15.5, color: "#495057", fontWeight: "700" },
    emptySubText: {
        fontSize: 12.5,
        color: "#8A96A3",
        marginTop: 4,
        textAlign: "center",
        fontWeight: "500",
    },

    /* Card */
    card: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        shadowColor: "#0A1F44",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    accentRail: { width: 5 },
    cardBody: { flex: 1, padding: 16 },

    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    titleBlock: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 16.5, fontWeight: "800", color: PRIMARY },
    appliedRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 },
    appliedText: { fontSize: 11.5, color: "#8A96A3", fontWeight: "500" },

    statusTag: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    pendingBadge: { backgroundColor: "#FFF4E0" },
    approvedBadge: { backgroundColor: "#E4F7EC" },
    rejectedBadge: { backgroundColor: "#FDEBEA" },
    statusTagText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },

    divider: {
        height: 1,
        backgroundColor: "#EEF1F5",
        marginTop: 14,
        marginBottom: 12,
    },

    /* Symmetric grid */
    grid: {
        flexDirection: "row",
        alignItems: "stretch",
        marginBottom: 12,
    },
    gridCol: { flex: 1 },
    gridDivider: { width: 1, backgroundColor: "#EEF1F5", marginHorizontal: 14 },
    gridLabel: {
        fontSize: 10,
        color: "#B0B9C4",
        fontWeight: "700",
        letterSpacing: 0.6,
        marginBottom: 5,
    },
    gridValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    gridValue: { fontSize: 13.5, color: "#2E3A4A", fontWeight: "700" },
    miniDot: { width: 8, height: 8, borderRadius: 4 },

    reasonBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F7F9FC",
        borderRadius: 12,
        padding: 10,
        gap: 8,
        marginTop: 2,
    },
    reasonText: {
        flex: 1,
        fontSize: 12.5,
        color: "#6B7684",
        lineHeight: 18,
        fontStyle: "italic",
    },

    cancelButtonWrap: {
        marginTop: 14,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: DANGER_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButton: {
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        marginLeft: 8,
        fontSize: 14,
    },

    /* Burn overlay */
    charLayer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "visible",
    },
    flameBar: {
        position: "absolute",
        top: -7,
        left: 0,
        right: 0,
        height: 14,
    },
    flameGradient: {
        flex: 1,
    },

    /* Cancel confirmation modal */
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,20,45,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        paddingTop: 8,
        paddingBottom: 22,
        paddingHorizontal: 22,
        alignItems: "center",
        shadowColor: "#0A1F44",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    modalLottieWrap: {
        width: 150,
        height: 150,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: -6,
    },
    modalLottie: {
        width: 180,
        height: 180,
    },
    modalTitle: {
        fontSize: 18.5,
        fontWeight: "800",
        color: PRIMARY,
        textAlign: "center",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 13,
        color: "#6B7684",
        textAlign: "center",
        lineHeight: 19,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    modalButtonRow: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    modalKeepButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: "#F1F4F8",
        borderWidth: 1,
        borderColor: "#E3E8EE",
        alignItems: "center",
        justifyContent: "center",
    },
    modalKeepButtonText: {
        color: PRIMARY,
        fontWeight: "700",
        fontSize: 14,
    },
    modalConfirmButtonWrap: {
        flex: 1,
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: DANGER_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalConfirmButton: {
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    modalConfirmButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },

    /* Custom tab bar */
    tabBar: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEF1F5",
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 22 : 10,
        justifyContent: "space-between",
    },
    tabItemWrap: { flex: 1, alignItems: "center" },
    tabItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 22,
        gap: 7,
        width: "100%",
    },
    tabLabel: { fontSize: 13 },
});
