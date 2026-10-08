// WE ARE USING THIS FILE AS PROFILE.TSX NOW

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  TextInputProps,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { changePassword } from "../../Services/User/User.service";
import { useSelector, shallowEqual } from "react-redux";
import moment from "moment";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import { themedStyles, C, PALETTES, ThemeMode, useTheme } from "../../Global/ThemeContext";

const PAGE_BG = "#F4F7FB";

// ─── Helpers ──────────────────────────────────────────────────────────────

const hasValue = (value: any) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const getInitials = (name?: string) =>
  (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "U";

const getTenure = (joiningDate?: string) => {
  if (!joiningDate) return "";
  const joined = moment(joiningDate);
  if (!joined.isValid()) return "";
  const years = moment().diff(joined, "years");
  const months = moment().diff(joined.clone().add(years, "years"), "months");
  if (years > 0) return months > 0 ? `${years}y ${months}m` : `${years}y`;
  if (months > 0) return `${months}m`;
  return "New";
};

type Strength = { score: number; label: string; color: string };

const getPasswordStrength = (password: string): Strength => {
  if (!password) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels: Strength[] = [
    { score: 1, label: "Weak", color: C.dangerText },
    { score: 1, label: "Weak", color: C.dangerText },
    { score: 2, label: "Fair", color: C.warningText },
    { score: 3, label: "Good", color: "#2563EB" },
    { score: 4, label: "Strong", color: C.successText },
  ];
  return levels[score];
};

// ════════════════════════════════════════════════════════════════════════
//  Building blocks (module level so inputs never remount while typing)
// ════════════════════════════════════════════════════════════════════════

const HeroStat = ({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) => (
  <GlassSurface tone="dark" radius={14} style={styles.heroStat}>
    <MaterialCommunityIcons name={icon} size={16} color="rgba(255,255,255,0.85)" />
    <Text style={styles.heroStatValue} numberOfLines={1}>
      {value || "—"}
    </Text>
    <Text style={styles.heroStatLabel} numberOfLines={1}>
      {label}
    </Text>
  </GlassSurface>
);

const InfoRow = ({
  icon,
  label,
  value,
  last,
}: {
  icon: any;
  label: string;
  value?: string;
  last?: boolean;
}) => {
  const present = hasValue(value);
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={C.accent} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, !present && styles.infoValueEmpty]}
          selectable={present}
          numberOfLines={2}
        >
          {present ? value : "Not available"}
        </Text>
      </View>
    </View>
  );
};

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={16} color={BRAND.primaryMuted} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const ContactButton = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[styles.contactButton, disabled && styles.contactButtonDisabled]}
  >
    <MaterialCommunityIcons name={icon} size={16} color={C.accent} />
    <Text style={styles.contactButtonText}>{label}</Text>
  </TouchableOpacity>
);

// ─── Appearance picker: preview tiles for each theme ─────────────────────
const AppearancePicker = () => {
  const { mode, setMode } = useTheme();
  const options: { key: ThemeMode; label: string; icon: any }[] = [
    { key: "light", label: "Light", icon: "white-balance-sunny" },
    { key: "dark", label: "Dark", icon: "weather-night" },
  ];
  return (
    <View style={styles.appearanceRow}>
      {options.map((option) => {
        const palette = PALETTES[option.key];
        const active = mode === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => !active && setMode(option.key)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.appearanceOption, active && styles.appearanceOptionActive]}
          >
            {/* Mini preview drawn with that theme's own palette */}
            <View style={[styles.preview, { backgroundColor: palette.background }]}>
              <LinearGradient
                colors={palette.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewHeader}
              />
              <View style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={[styles.previewLine, { backgroundColor: palette.accent, width: "55%" }]} />
                <View style={[styles.previewLine, { backgroundColor: palette.textFaint, width: "80%" }]} />
              </View>
            </View>
            <View style={styles.appearanceLabelRow}>
              <MaterialCommunityIcons
                name={active ? "radiobox-marked" : "radiobox-blank"}
                size={18}
                color={active ? C.accent : C.textFaint}
              />
              <MaterialCommunityIcons name={option.icon} size={16} color={C.textSoft} />
              <Text style={[styles.appearanceLabel, active && styles.appearanceLabelActive]}>
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

type PasswordFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: React.ReactNode;
};

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  ({ label, error, hint, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const [focused, setFocused] = useState(false);
    return (
      <View style={styles.pwField}>
        <Text style={styles.pwLabel}>{label}</Text>
        <View
          style={[
            styles.pwBox,
            focused && styles.pwBoxFocused,
            !!error && styles.pwBoxError,
          ]}
        >
          <MaterialCommunityIcons
            name="lock-outline"
            size={18}
            color={focused ? BRAND.primaryLight : BRAND.primaryMuted}
          />
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={C.placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.pwInput}
          />
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <MaterialCommunityIcons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={BRAND.primaryMuted}
            />
          </TouchableOpacity>
        </View>
        {error ? (
          <View style={styles.pwErrorRow}>
            <MaterialCommunityIcons name="alert-circle" size={13} color={BRAND.danger} />
            <Text style={styles.pwErrorText}>{error}</Text>
          </View>
        ) : (
          hint
        )}
      </View>
    );
  }
);

const StrengthMeter = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  if (!password) return null;
  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthBar,
              level <= strength.score && { backgroundColor: strength.color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: strength.color }]}>
        {strength.label}
      </Text>
    </View>
  );
};

type PasswordErrors = { old?: string; next?: string; confirm?: string };

const ChangePasswordSheet = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setconfirmpassword("");
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleChangePassword = async () => {
    const next: PasswordErrors = {};
    if (!oldPassword) next.old = "Enter your current password.";
    if (!newPassword) next.next = "Enter a new password.";
    if (!confirmpassword) next.confirm = "Confirm your new password.";
    else if (newPassword !== confirmpassword)
      next.confirm = "New password and confirmation don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const message = await changePassword(oldPassword, newPassword, confirmpassword);
      alert(message);
      close();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const matches = !!confirmpassword && confirmpassword === newPassword;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.sheetBackdrop} onPress={close} />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <LinearGradient
              colors={C.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetIcon}
            >
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Change password</Text>
              <Text style={styles.sheetSubtitle}>
                Use at least 8 characters with a mix of types
              </Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.sheetClose} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={18} color={C.accent} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <PasswordField
              label="Current password"
              placeholder="Enter current password"
              value={oldPassword}
              onChangeText={(t) => {
                setOldPassword(t);
                if (errors.old) setErrors((e) => ({ ...e, old: undefined }));
              }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => newRef.current?.focus()}
              error={errors.old}
            />
            <PasswordField
              ref={newRef}
              label="New password"
              placeholder="Create a new password"
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (errors.next) setErrors((e) => ({ ...e, next: undefined }));
              }}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmRef.current?.focus()}
              error={errors.next}
              hint={<StrengthMeter password={newPassword} />}
            />
            <PasswordField
              ref={confirmRef}
              label="Confirm new password"
              placeholder="Re-enter new password"
              value={confirmpassword}
              onChangeText={(t) => {
                setconfirmpassword(t);
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
              }}
              returnKeyType="done"
              onSubmitEditing={handleChangePassword}
              error={errors.confirm}
              hint={
                matches ? (
                  <View style={styles.pwErrorRow}>
                    <MaterialCommunityIcons name="check-circle" size={13} color={C.successText} />
                    <Text style={[styles.pwErrorText, { color: C.successText }]}>
                      Passwords match
                    </Text>
                  </View>
                ) : null
              }
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity onPress={close} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={submitting}
                activeOpacity={0.9}
                style={styles.primaryTouch}
              >
                <LinearGradient
                  colors={C.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  )}
                  <Text style={styles.primaryButtonText}>
                    {submitting ? "Updating..." : "Update password"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════
//  Screen
// ════════════════════════════════════════════════════════════════════════

const ProfilePage = () => {
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const user = useSelector((state: any) => state.userDetails.user, shallowEqual);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const joined =
    user?.joiningdate && moment(user.joiningdate).isValid()
      ? moment(user.joiningdate).format("DD MMM YYYY")
      : "";
  const manager = user?.manager;

  const openLink = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ───────────────────────────────────────────────── */}
        <LinearGradient
          colors={C.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.heroCircle, styles.heroCircleA]} />
            <View style={[styles.heroCircle, styles.heroCircleB]} />
          </View>

          <View style={styles.avatarRing}>
            <LinearGradient
              colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0.10)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.userName}>{user?.name || "User Name"}</Text>
          <Text style={styles.userRole}>
            {[user?.role, user?.department].filter(hasValue).join(" • ") || "Employee"}
          </Text>
          {hasValue(user?.employeecode) && (
            <View style={styles.codeChip}>
              <MaterialCommunityIcons name="card-account-details-outline" size={13} color="#FFFFFF" />
              <Text style={styles.codeChipText}>EMP {user.employeecode}</Text>
            </View>
          )}

          <View style={styles.heroStats}>
            <HeroStat icon="calendar-check" value={joined} label="Joined" />
            <HeroStat icon="timer-sand" value={getTenure(user?.joiningdate)} label="With us" />
            <HeroStat
              icon="cake-variant-outline"
              value={hasValue(user?.age) ? `${user.age} yrs` : ""}
              label="Age"
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Personal ─────────────────────────────────────────── */}
          <SectionCard title="Personal information" icon="account-outline">
            <InfoRow icon="account" label="Full name" value={user?.name} />
            <InfoRow icon="card-account-details-outline" label="Employee code" value={user?.employeecode} />
            <InfoRow icon="email-outline" label="Email" value={user?.email} />
            <InfoRow icon="phone-outline" label="Phone" value={user?.phone} />
            <InfoRow icon="briefcase-outline" label="Role" value={user?.role} />
            <InfoRow icon="calendar-month-outline" label="Joining date" value={joined} last />
          </SectionCard>

          {/* ── Reporting ────────────────────────────────────────── */}
          <SectionCard title="Reporting to" icon="account-supervisor-outline">
            <View style={styles.managerRow}>
              <LinearGradient
                colors={C.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.managerAvatar}
              >
                <Text style={styles.managerInitials}>{getInitials(manager?.name)}</Text>
              </LinearGradient>
              <View style={styles.managerInfo}>
                <Text style={styles.managerName} numberOfLines={1}>
                  {manager?.name || "Not assigned"}
                </Text>
                <Text style={styles.managerMeta} numberOfLines={1}>
                  {manager?.email || "No email on record"}
                </Text>
                {hasValue(manager?.phone) && (
                  <Text style={styles.managerMeta} numberOfLines={1}>
                    {manager.phone}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.contactRow}>
              <ContactButton
                icon="phone-outline"
                label="Call"
                disabled={!hasValue(manager?.phone)}
                onPress={() => openLink(`tel:${manager?.phone}`)}
              />
              <ContactButton
                icon="email-outline"
                label="Email"
                disabled={!hasValue(manager?.email)}
                onPress={() => openLink(`mailto:${manager?.email}`)}
              />
            </View>
          </SectionCard>

          {/* ── Security ─────────────────────────────────────────── */}
          <SectionCard title="Appearance" icon="palette-outline">
            <AppearancePicker />
          </SectionCard>

          <SectionCard title="Security" icon="shield-account-outline">
            <TouchableOpacity
              onPress={() => setPasswordModalVisible(true)}
              activeOpacity={0.8}
              style={styles.actionRow}
            >
              <LinearGradient
                colors={C.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIcon}
              >
                <MaterialCommunityIcons name="lock-reset" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Change password</Text>
                <Text style={styles.actionSubtitle}>Keep your account secure</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={C.primaryMuted} />
            </TouchableOpacity>
          </SectionCard>
        </View>
      </ScrollView>

      <ChangePasswordSheet
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </Animated.View>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContent: {
    paddingBottom: 28,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  heroCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircleA: { width: 200, height: 200, top: -110, right: -60 },
  heroCircleB: {
    width: 120,
    height: 120,
    bottom: -70,
    left: -30,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 12,
    textAlign: "center",
  },
  userRole: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
    textTransform: "capitalize",
  },
  codeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  heroStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    alignSelf: "stretch",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },

  // Sections
  body: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 18,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND.primaryMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 2,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BRAND.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    color: BRAND.inkSoft,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    color: BRAND.ink,
    fontWeight: "600",
    marginTop: 2,
  },
  infoValueEmpty: {
    fontWeight: "400",
    fontStyle: "italic",
    color: c.textFaint,
  },

  // Manager
  managerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
  },
  managerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  managerInitials: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  managerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.ink,
  },
  managerMeta: {
    fontSize: 12.5,
    color: BRAND.inkSoft,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  contactButtonDisabled: {
    opacity: 0.4,
  },
  contactButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: c.accent,
  },

  // Security
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  actionSubtitle: {
    fontSize: 12,
    color: BRAND.inkSoft,
    marginTop: 1,
  },

  // Appearance
  appearanceRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  appearanceOption: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: c.border,
    padding: 8,
  },
  appearanceOptionActive: {
    borderColor: c.accent,
    backgroundColor: c.primaryFaint,
  },
  preview: {
    height: 74,
    borderRadius: 10,
    overflow: "hidden",
  },
  previewHeader: {
    height: 22,
  },
  previewCard: {
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 7,
    gap: 5,
  },
  previewLine: {
    height: 5,
    borderRadius: 3,
  },
  appearanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  appearanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textSoft,
  },
  appearanceLabelActive: {
    color: c.text,
    fontWeight: "700",
  },

  // Password sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "90%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.primaryFaint,
    marginBottom: 14,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  sheetIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.ink,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: BRAND.inkSoft,
    marginTop: 2,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.primaryFaint,
  },
  pwField: {
    marginTop: 14,
  },
  pwLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.ink,
    marginBottom: 7,
  },
  pwBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surfaceAlt,
  },
  pwBoxFocused: {
    borderColor: BRAND.primaryLight,
    backgroundColor: c.surface,
  },
  pwBoxError: {
    borderColor: "rgba(214,69,69,0.6)",
  },
  pwInput: {
    flex: 1,
    fontSize: 15,
    color: BRAND.ink,
    paddingVertical: 12,
  },
  pwErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  pwErrorText: {
    fontSize: 12,
    color: BRAND.danger,
    fontWeight: "500",
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.primaryFaint,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 46,
    textAlign: "right",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: c.accent,
  },
  primaryTouch: {
    flex: 1.6,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
}));

export default ProfilePage;
