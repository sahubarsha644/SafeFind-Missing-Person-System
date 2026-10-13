import * as Location from "expo-location";

import { router } from "expo-router";

import { useState } from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { saveAuthToken } from "../utils/authStorage";

import {
  getExpoPushToken,
  saveExpoPushToken,
  setupNotifications,
} from "../utils/notifications";

const API_URL = "http://10.141.43.231:5000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/onboarding");
    }
  };

  const handleLogin = async () => {
    setValidationError("");

    if (!email.trim()) {
      setValidationError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setValidationError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      // =========================
      // LOGIN
      // =========================

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setValidationError(
          data.message ||
            "Invalid email or password."
        );
        return;
      }

      // =========================
      // SAVE JWT TOKEN
      // =========================

      await saveAuthToken(data.token);

      // =========================
      // SAVE USER LOCATION
      // =========================

      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setValidationError(
            "Location permission is required to continue."
          );
          return;
        }

        const location =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        const { latitude, longitude } =
          location.coords;

        console.log(
          "User location:",
          latitude,
          longitude
        );

        const locationResponse =
          await fetch(
            `${API_URL}/api/users/location`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${data.token}`,
              },
              body: JSON.stringify({
                latitude,
                longitude,
              }),
            }
          );

        const locationData =
          await locationResponse.json();

        if (!locationResponse.ok) {
          console.error(
            "Failed to save location:",
            locationData
          );

          setValidationError(
            "Could not save your location. Please try again."
          );

          return;
        }

        console.log(
          "Location saved successfully"
        );
      } catch (locationError) {
        console.error(
          "Location setup error:",
          locationError
        );

        setValidationError(
          "Unable to get your location. Please allow location access."
        );

        return;
      }

      // =========================
      // SETUP NOTIFICATIONS
      // =========================

      try {
        await setupNotifications();

        const expoPushToken =
          await getExpoPushToken();

        if (expoPushToken) {
          await saveExpoPushToken(
            expoPushToken,
            data.token
          );
        }
      } catch (notificationError) {
        console.error(
          "Notification setup error:",
          notificationError
        );

        // Notification failure should NOT
        // stop the login process.
      }

      // =========================
      // NORMAL LOGIN NAVIGATION
      // =========================

      if (data.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/userdashboard");
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setValidationError(
        "Could not connect to SafeFind server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.blueHeader}>
              <Pressable
                style={styles.backButton}
                onPress={handleBack}
                hitSlop={10}
              >
                <Text style={styles.backIcon}>
                  ‹
                </Text>
              </Pressable>

              <View style={styles.headerBrand}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />

                <Text
                  style={styles.headerBrandText}
                >
                  SafeFind
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.headerTitle}>
                Welcome Back
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                Sign in to continue helping
                people get home.
              </Text>

              <View style={styles.tabRow}>
                <View
                  style={styles.activeTab}
                >
                  <Text
                    style={styles.activeTabText}
                  >
                    Login
                  </Text>
                </View>

                <Pressable
                  style={styles.inactiveTab}
                  onPress={() =>
                    router.push("/signup")
                  }
                >
                  <Text
                    style={
                      styles.inactiveTabText
                    }
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.formTitle}>
                Sign in to SafeFind
              </Text>

              <Text
                style={styles.formSubtitle}
              >
                Use your registered email and
                password.
              </Text>

              <Text style={styles.label}>
                Email
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setValidationError("");
                }}
              />

              <View
                style={styles.passwordLabelRow}
              >
                <Text style={styles.label}>
                  Password
                </Text>

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  hitSlop={8}
                >
                  <Text
                    style={styles.showText}
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={
                  !showPassword
                }
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setValidationError("");
                }}
              />

              <View style={styles.helperRow}>
                <Text
                  style={styles.helperSmall}
                >
                  Keep your account details
                  private.
                </Text>

                
              </View>

              {validationError ? (
                <Text
                  style={styles.errorText}
                >
                  {validationError}
                </Text>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      color="#FFFFFF"
                      size="small"
                    />

                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      Signing in...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Login
                  </Text>
                )}
              </Pressable>

              <View style={styles.bottomRow}>
                <Text
                  style={styles.bottomText}
                >
                  Don't have an account?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push("/signup")
                  }
                >
                  <Text
                    style={styles.linkText}
                  >
                    {" "}Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.footerText}>
              SafeFind • Bringing people home
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    flex: 1,
    minHeight: "100%",
  },

  blueHeader: {
    minHeight: 280,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 80,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.16)",
  },

  backIcon: {
    fontSize: 32,
    lineHeight: 32,
    color: "#FFFFFF",
    marginTop: -3,
  },

  headerBrand: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  logoImage: {
    width: 118,
    height: 118,
  },

  headerBrandText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -0.5,
  },

  formCard: {
    marginTop: -50,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },

  headerTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  headerSubtitle: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 4,
    borderRadius: 14,
    marginBottom: 20,
  },

  activeTab: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  activeTabText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  inactiveTab: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  inactiveTabText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },

  formTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  formSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
  },

  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  showText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 15,
  },

  helperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -2,
  },

  helperSmall: {
    flex: 1,
    fontSize: 10,
    color: "#94A3B8",
  },

  forgotText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
  },

  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#B42318",
    marginTop: 8,
  },

  primaryButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 17,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  bottomText: {
    fontSize: 11,
    color: "#64748B",
  },

  linkText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },

  footerText: {
    textAlign: "center",
    fontSize: 9,
    color: "#64748B",
    marginTop: 16,
    marginBottom: 22,
  },
});