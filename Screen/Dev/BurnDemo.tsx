// Screen/Dev/BurnDemo.tsx
// Playground for the BurnCard dismiss effect (development builds only).
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BurnCard, BurnOrigin } from "../../Component/Effects/BurnCard";
import { themedStyles, C } from "../../Global/ThemeContext";

type DemoCard = { id: number; title: string; subtitle: string; origin: BurnOrigin; label: string };

const CARDS: DemoCard[] = [
  { id: 1, title: "Casual Leave", subtitle: "12 Oct → 13 Oct · 2 days", origin: "top-left", label: "Top-left corner" },
  { id: 2, title: "Laptop request", subtitle: "Ticket #00A1F3 · Pending", origin: "bottom-right", label: "Bottom-right corner" },
  { id: 3, title: "Timesheet entry", subtitle: "Fix login bug · 2h 30m", origin: "edges", label: "All edges" },
  { id: 4, title: "Reimbursement", subtitle: "Travel · ₹1,250", origin: ["top-left", "bottom-right"], label: "Two corners" },
  { id: 5, title: "Overtime request", subtitle: "Sat 18 Oct · 4h", origin: "random", label: "Random" },
];

export default function BurnDemo() {
  const [burning, setBurning] = useState<Record<number, boolean>>({});
  const [gone, setGone] = useState<Record<number, boolean>>({});
  const [round, setRound] = useState(0); // remount cards on reset

  const reset = () => {
    setBurning({});
    setGone({});
    setRound((r) => r + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Paper burn effect</Text>
          <Text style={styles.subtitle}>Tap Burn on any card. Each starts from a different origin.</Text>
        </View>
        <TouchableOpacity onPress={reset} style={styles.reset}>
          <MaterialCommunityIcons name="restore" size={18} color={C.accent} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {CARDS.map((card) =>
        gone[card.id] ? (
          <View key={`${card.id}-${round}`} style={styles.ghost}>
            <Text style={styles.ghostText}>Burnt from: {card.label}</Text>
          </View>
        ) : (
          <View key={`${card.id}-${round}`} style={styles.slot}>
            <BurnCard
              burning={!!burning[card.id]}
              origin={card.origin}
              onBurnComplete={() => setGone((g) => ({ ...g, [card.id]: true }))}
            >
              <View style={styles.card}>
                <View style={styles.rail} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.originChip}>
                      <MaterialCommunityIcons name="fire" size={13} color={C.warningText} />
                      <Text style={styles.originText}>{card.label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setBurning((b) => ({ ...b, [card.id]: true }))}
                      disabled={!!burning[card.id]}
                      style={styles.burnButton}
                    >
                      <Text style={styles.burnButtonText}>Burn</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BurnCard>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = themedStyles((c) => ({
  content: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: c.background,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: c.text,
  },
  subtitle: {
    fontSize: 13,
    color: c.textSoft,
    marginTop: 2,
  },
  reset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: c.primaryFaint,
  },
  resetText: {
    fontSize: 13,
    fontWeight: "700",
    color: c.accent,
  },
  slot: {
    marginTop: 28, // room for flames rising above the card
  },
  card: {
    flexDirection: "row",
    backgroundColor: c.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.border,
  },
  rail: {
    width: 5,
    backgroundColor: c.primary,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: c.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: c.textSoft,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  originChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: c.warningBg,
  },
  originText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.warningText,
  },
  burnButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#C2410C",
  },
  burnButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  ghost: {
    marginTop: 28,
    height: 104,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: c.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textFaint,
  },
}));
