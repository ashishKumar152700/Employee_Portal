import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    Animated,
    Easing,
    RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves } from "../../Services/Leave/Leave.service";
import { FAB } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../Global/Types";
import { NativeStackNavigationProp  } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function MyLeaveScreen() {
    const [leaveDetails, setLeaveDetails] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(30));
    const [rotateAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));
    const [iconScaleAnims] = useState([
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
    ]);
    const [checkIconAnims] = useState([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);
    const [cardAnimations] = useState([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]);
    const dispatch = useDispatch();
    const leaveDetailsSelector = useSelector((state: any) => state.leaveDetails);
    const navigation = useNavigation();
    type leaveHistory = NativeStackNavigationProp <RootStackParamList, "leaveHistory">;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        async function fetchLeaveDetails() {
            try {
                const leaves = await getLeaves(dispatch);
                setLeaveDetails(leaves.data);
            } catch (error) {
                console.error("Error fetching leave details:", error);
            }
        }
        await fetchLeaveDetails();
        setRefreshing(false);
    }, [dispatch]);

    useEffect(() => {
        async function fetchLeaveDetails() {
            try {
                const leaves = await getLeaves(dispatch);
                console.log("Fetched leaves data:", leaves.data);
                setLeaveDetails(leaves.data);
            } catch (error) {
                console.error("Error fetching leave details:", error);
            }
        }
        fetchLeaveDetails();
    }, [dispatch]);

    useEffect(() => {
        // Main fade and slide animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered card animations
        cardAnimations.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 500,
                delay: 300 + index * 80,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }).start();
        });

        // Check icon staggered animations
        checkIconAnims.forEach((anim, index) => {
            Animated.sequence([
                Animated.delay(800 + index * 150),
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 4,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]).start();
        });

        // Continuous rotation animation for the wrench icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Continuous pulse animation for the background
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Continuous scale animation for leave category icons
        iconScaleAnims.forEach((anim, index) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 200),
                    Animated.timing(anim, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["-10deg", "15deg"],
    });

    const getLeaveData = () => {
        if (
            !leaveDetailsSelector ||
            Object.keys(leaveDetailsSelector).length === 0
        ) {
            console.log("No leave data found, using defaults");
            return {
                casualleave: 0,
                sickleave: 0,
                optionalleave: 0,
                paidleave: 0,
                earnedleave: 0,
                maternityleave: 0,
                paternityleave: 0,
            };
        }

        console.log("Using leave data from selector:", leaveDetailsSelector);
        return leaveDetailsSelector;
    };

    const leaveData = getLeaveData();

    // API returns REMAINING leaves
    const casualLeavesLeft = leaveData.casualleave || 0;
    const sickLeavesLeft = leaveData.sickleave || 0;
    const optionalLeavesLeft = leaveData.optionalleave || 0;
    const paidLeavesLeft = leaveData.paidleave || 0;

    const handleLeaveHistoryPress = () => {
        navigation.navigate("leaveHistory");
    };

    const leaveCategories = [
        {
            name: "Paid",
            left: paidLeavesLeft,
            icon: "work",
            color: "#002957",
            anim: cardAnimations[0],
            iconAnim: iconScaleAnims[0],
        },
        {
            name: "Casual",
            left: casualLeavesLeft,
            icon: "beach-access",
            color: "#002957",
            anim: cardAnimations[1],
            iconAnim: iconScaleAnims[1],
        },
        {
            name: "Sick",
            left: sickLeavesLeft,
            icon: "local-hospital",
            color: "#002957",
            anim: cardAnimations[2],
            iconAnim: iconScaleAnims[2],
        },
        {
            name: "Optional",
            left: optionalLeavesLeft,
            icon: "event-available",
            color: "#002957",
            anim: cardAnimations[3],
            iconAnim: iconScaleAnims[3],
        },
    ];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentWrapper}>
                {/* Coming Soon Card */}
                    <View style={styles.comingSoonCard}>
                        <Animated.View
                            style={[
                                styles.iconContainer,
                                { transform: [{ scale: pulseAnim }] },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.iconWrapper,
                                    { transform: [{ rotate: rotateInterpolate }] },
                                ]}
                            >
                                <Icon name="build" size={36} color="#002957" />
                                {/*<Icon name="schedule" size={36} color="#002957" />*/}
                                <Icon name="settings" size={36} color="#002957" />
                                {/*<Icon name="hourglass-empty" size={36} color="#002957" />*/}
                                {/*<Icon name="update" size={36} color="#002957" />*/}
                                {/*<Icon name="rocket-launch" size={36} color="#002957" />*/}

                            </Animated.View>
                        </Animated.View>

                        <Text style={styles.comingSoonTitle}>Detailed Analytics Coming Soon!</Text>
                        <Text style={styles.comingSoonSubtitle}>
                            Building comprehensive tracking & insights
                        </Text>
                    </View>

                    {/* Quick Leave Balance Overview */}
                    <View style={styles.balanceOverview}>
                        <Text style={styles.sectionTitle}>Current Balance</Text>

                        <View style={styles.leaveGrid}>
                            {leaveCategories.map((leave, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.leaveCard,
                                        {
                                            opacity: leave.anim,
                                            transform: [
                                                {
                                                    scale: leave.anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.7, 1],
                                                    }),
                                                },
                                                {
                                                    translateY: leave.anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [20, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <Animated.View
                                        style={[
                                            styles.leaveIconBg,
                                            {
                                                backgroundColor: `${leave.color}15`,
                                                transform: [{ scale: leave.iconAnim }],
                                            },
                                        ]}
                                    >
                                        <Icon name={leave.icon} size={20} color={leave.color} />
                                    </Animated.View>
                                    <Text style={styles.leaveName}>{leave.name}</Text>
                                    <Text style={styles.leaveBalanceLabel}>{leave.left} left</Text>
                                    {/*<Text style={styles.leaveBalanceLabel}>left</Text>*/}
                                </Animated.View>
                            ))}
                        </View>
                    </View>

                    {/* Info Section */}
                    <View style={styles.infoCard}>
                        {[
                            "Apply leaves from bottom menu",
                            "View history with button below",
                            "All requests processed normally",
                        ].map((text, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.infoRow,
                                    {
                                        opacity: checkIconAnims[index],
                                        transform: [
                                            {
                                                scale: checkIconAnims[index],
                                            },
                                            {
                                                translateX: checkIconAnims[index].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [-20, 0],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <Icon
                                    name="check-circle"
                                    size={18}
                                    color="#28a745"
                                    style={styles.checkIcon}
                                />
                                <Text style={styles.infoText}>{text}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                <FAB
                    style={styles.fab}
                    icon="history"
                    label="Leave History"
                    onPress={handleLeaveHistoryPress}
                    color="white"
                />
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    safeArea: {
        flex: 1,
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#002957",
    },
    comingSoonCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        alignItems: "center",
    },
    iconContainer: {
        width: 84,
        height: 84,
        borderRadius: 32,
        backgroundColor: "#e9f0f7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    iconWrapper: {
        justifyContent: "center",
        alignItems: "center",
    },
    comingSoonTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#002957",
        marginBottom: 4,
        textAlign: "center",
    },
    comingSoonSubtitle: {
        fontSize: 12,
        color: "#6c757d",
        textAlign: "center",
    },
    balanceOverview: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#002957",
        marginBottom: 12,
    },
    leaveGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    leaveCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        alignItems: "center",
    },
    leaveIconBg: {
        width: 60,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    leaveName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#002957",
        marginBottom: 4,
    },
    leaveBalance: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#002957",
        lineHeight: 26,
    },
    leaveBalanceLabel: {
        fontSize: 12,
        color: "#28a745",
        fontWeight: "500",
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    checkIcon: {
        marginRight: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: "#495057",
        lineHeight: 16,
    },
    fab: {
        position: "absolute",
        right: 16,
        bottom: 26,
        backgroundColor: "#002957",
    },
});

