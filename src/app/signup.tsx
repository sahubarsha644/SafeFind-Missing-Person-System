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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

const API_URL = "http://10.141.43.231:5000";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationText, setLocationText] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/onboarding");
    }
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      setValidationError("");

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setValidationError(
          "Location permission is required for nearby alerts."
        );
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      const addresses =
        await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

      if (addresses.length > 0) {
        const address = addresses[0];

        const parts = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
        ]
          .filter(Boolean)
          .filter(
            (value, index, array) =>
              array.indexOf(value) === index
          );

        setLocationText(
          parts.join(", ") ||
            `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        );
      } else {
        setLocationText(
          `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        );
      }
    } catch (error) {
      console.error("Signup location error:", error);
      setValidationError(
        "Could not get your location. Please try again."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSignup = async () => {
    setValidationError("");

    if (!fullName.trim()) {
      setValidationError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setValidationError(
        "Please enter your email address."
      );
      return;
    }

    if (!email.includes("@")) {
      setValidationError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!phone.trim()) {
      setValidationError(
        "Please enter your phone number."
      );
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      setValidationError(
        "Please enter a valid phone number."
      );
      return;
    }

    if (password.length < 6) {
      setValidationError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(
        "Passwords do not match."
      );
      return;
    }

    if (latitude === null || longitude === null) {
      setValidationError(
        "Please select your current location to continue."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            latitude,
            longitude,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setValidationError(
          data.message ||
            "Could not create your account."
        );
        return;
      }

      alert("Account created successfully!");
      router.replace("/login");
    } catch (error) {
      console.error("Signup error:", error);
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
              <Text style={styles.cardTitle}>
                Create Account
              </Text>

              <Text style={styles.cardSubtitle}>
                Join SafeFind and help bring people
                home.
              </Text>

              <View style={styles.tabRow}>
                <Pressable
                  style={styles.inactiveTab}
                  onPress={() =>
                    router.push("/login")
                  }
                >
                  <Text
                    style={styles.inactiveTabText}
                  >
                    Login
                  </Text>
                </Pressable>

                <View style={styles.activeTab}>
                  <Text
                    style={styles.activeTabText}
                  >
                    Sign Up
                  </Text>
                </View>
              </View>

              <Text style={styles.formTitle}>
                Get started free
              </Text>

              <Text style={styles.formSubtitle}>
                Create your account in a few simple
                steps.
              </Text>

              <Text style={styles.label}>
                Full Name
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setValidationError("");
                }}
              />

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

              <Text style={styles.label}>
                Phone Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setValidationError("");
                }}
              />

              <Text style={styles.label}>
                Alert Location *
              </Text>

              <Pressable
                style={[
                  styles.locationButton,
                  locationLoading &&
                    styles.disabledButton,
                ]}
                onPress={handleGetLocation}
                disabled={
                  locationLoading || loading
                }
              >
                {locationLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#2563EB"
                  />
                ) : (
                  <Text
                    style={styles.locationIcon}
                  >
                    📍
                  </Text>
                )}

                <View
                  style={styles.locationTextBox}
                >
                  <Text
                    style={styles.locationTitle}
                  >
                    {locationText
                      ? "Location Selected"
                      : "Use Current Location"}
                  </Text>

                  <Text
                    style={
                      styles.locationSubtitle
                    }
                  >
                    {locationText ||
                      "Required for nearby missing-person alerts"}
                  </Text>
                </View>
              </Pressable>

              <View
                style={styles.passwordLabelRow}
              >
                <Text style={styles.label}>
                  Password
                </Text>

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={8}
                >
                  <Text style={styles.showText}>
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Create a password"
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

              <View
                style={styles.passwordLabelRow}
              >
                <Text style={styles.label}>
                  Confirm Password
                </Text>

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  hitSlop={8}
                >
                  <Text style={styles.showText}>
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={
                  !showConfirmPassword
                }
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setValidationError("");
                }}
              />

              <Text style={styles.passwordHint}>
                Password must contain at least 6
                characters.
              </Text>

              {validationError ? (
                <Text style={styles.errorText}>
                  {validationError}
                </Text>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={handleSignup}
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
                      Creating account...
                    </Text>
                  </>
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Create Account
                  </Text>
                )}
              </Pressable>

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>
                  Already have an account?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push("/login")
                  }
                >
                  <Text style={styles.linkText}>
                    {" Login"}
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
    minHeight: 250,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 72,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.16)",
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 30,
    color: "#FFFFFF",
    marginTop: -3,
  },
  headerBrand: {
    alignItems: "center",
    marginTop: 20,
  },
  logoImage: {
    width: 108,
    height: 108,
  },
  headerBrandText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.5,
  },
  formCard: {
    marginTop: -42,
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
  cardTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 18,
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
    fontSize: 18,
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
    justifyContent: "space-between",
    alignItems: "center",
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
  locationButton: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  locationIcon: {
    fontSize: 21,
    marginRight: 11,
  },
  locationTextBox: {
    flex: 1,
  },
  locationTitle: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "800",
  },
  locationSubtitle: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  passwordHint: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: -2,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#B42318",
    marginTop: 7,
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