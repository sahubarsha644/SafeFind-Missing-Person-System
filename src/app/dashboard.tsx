import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAuthToken,
  removeAuthToken,
} from "../utils/authStorage";

const API_URL = "http://10.141.43.231:5000";

export default function HomeScreen() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        setLoggedIn(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        await removeAuthToken();
        setLoggedIn(false);
        setRole(null);
        return;
      }

      setLoggedIn(true);
      setRole(data.user.role);
    } catch (error) {
      console.error("Login check error:", error);
      setLoggedIn(false);
      setRole(null);
    } finally {
      setChecking(false);
    }
  };

  const continueToApp = () => {
    router.replace(role === "admin" ? "/admin" : "/userdashboard");
  };

  const startApp = () => {
    router.push("/login");
  };

  const logout = async () => {
    await removeAuthToken();
    setLoggedIn(false);
    setRole(null);
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <View style={styles.loadingCenter}>
          <View style={styles.loadingLogoBox}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.loadingBrand}>SafeFind</Text>

          <ActivityIndicator
            size="small"
            color="#2563EB"
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingText}>
            Checking your session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.blueHeader}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />

              <View>
                <Text style={styles.brandName}>SafeFind</Text>
                <Text style={styles.brandLabel}>
                  MISSING PERSON ALERT
                </Text>
              </View>
            </View>

            <View style={styles.safeBadge}>
              <Text style={styles.safeBadgeText}>SAFE</Text>
            </View>
          </View>

          <View style={styles.heroSection}>
            <View style={styles.heroLogoBox}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.heroTitle}>Find. Share. Reunite.</Text>

            <Text style={styles.heroSubtitle}>
              Report missing people, share sightings and help bring
              them home.
            </Text>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.cardEyebrow}>HOW SAFEFIND HELPS</Text>

            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>+</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Report</Text>
                  <Text style={styles.featureText}>
                    Submit a missing-person case.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>⌖</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Locate</Text>
                  <Text style={styles.featureText}>
                    Share useful sighting information.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>✓</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Reunite</Text>
                  <Text style={styles.featureText}>
                    Help verified cases move forward.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {loggedIn ? (
            <View style={styles.buttonSection}>
              <View style={styles.welcomeBox}>
                <Text style={styles.welcomeTitle}>
                  Welcome back
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  You are signed in as{" "}
                  <Text style={styles.roleText}>{role}</Text>.
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={continueToApp}
              >
                <Text style={styles.primaryButtonText}>
                  Continue to SafeFind
                </Text>
                <Text style={styles.arrow}>›</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={logout}
              >
                <Text style={styles.secondaryButtonText}>Logout</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buttonSection}>
              <Pressable
                style={styles.primaryButton}
                onPress={startApp}
              >
                <Text style={styles.primaryButtonText}>
                  Get Started
                </Text>
                <Text style={styles.arrow}>›</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.footerText}>
            SafeFind • Together we find them
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },

  loadingSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingLogoBox: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingLogo: {
    width: 68,
    height: 68,
  },

  loadingBrand: {
    fontSize: 29,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 12,
  },

  loadingIndicator: {
    marginTop: 18,
  },

  loadingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  container: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },

  blueHeader: {
    minHeight: 88,
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerLogo: {
    width: 52,
    height: 52,
    marginRight: 10,
  },

  brandName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  brandLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#DBEAFE",
    marginTop: 2,
  },

  safeBadge: {
    minWidth: 48,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  safeBadgeText: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },

  heroLogoBox: {
    width: 94,
    height: 94,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E6F7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    marginBottom: 14,
  },

  heroLogo: {
    width: 80,
    height: 80,
  },

  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.8,
  },

  heroSubtitle: {
    maxWidth: 420,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  actionCard: {
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  cardEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    color: "#2563EB",
    marginBottom: 13,
  },

  featureRow: {
    gap: 12,
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  featureIconText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "900",
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  featureText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 2,
  },

  buttonSection: {
    paddingHorizontal: 18,
    marginTop: 18,
  },

  welcomeBox: {
    alignItems: "center",
    marginBottom: 12,
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  roleText: {
    color: "#2563EB",
    fontWeight: "900",
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 24,
    marginLeft: 8,
    marginTop: -2,
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BFD3F4",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#1E3A8A",
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    textAlign: "center",
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 16,
  },
});
