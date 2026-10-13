import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  TouchableOpacity
} from "react-native";
import { router } from "expo-router";
import {
  getAuthToken,
  removeAuthToken,
} from "../utils/authStorage";

const API_URL = "http://10.141.43.231:5000";

type User = {
  fullName?: string;
  email?: string;
  role?: string;
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const contentWidth = Math.min(width - 32, 640);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
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
        router.replace("/login");
        return;
      }

      if (data.user?.role === "admin") {
        router.replace("/admin");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error("Dashboard user check error:", error);
      Alert.alert(
        "Connection error",
        "Could not connect to SafeFind server."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoggingOut(true);
      await removeAuthToken();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingLogoBox}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#2563EB"
            style={styles.loadingIndicator}
          />

          <Text style={styles.loadingTitle}>
            Loading SafeFind
          </Text>

          <Text style={styles.loadingText}>
            Preparing your dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: Math.max(
                18,
                (width - contentWidth) / 2
              ),
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.brandName}>SafeFind</Text>
              <Text style={styles.headerLabel}>
                USER DASHBOARD
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.logoutTopButton}
            onPress={logout}
            disabled={loggingOut}
          >
            <Text style={styles.logoutTopText}>Logout</Text>
          </Pressable>
        </View>

        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}>
              <Text style={styles.welcomeIconText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
              <Text style={styles.welcomeName}>
                {user?.fullName || "SafeFind User"}
              </Text>
              <Text style={styles.welcomeEmail}>
                {user?.email || ""}
              </Text>
            </View>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              How can you help today?
            </Text>

            <Text style={styles.introText}>
              Use SafeFind to report a missing person, share a
              sighting, or find verified missing-person cases.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/report")}
            >
              <View style={styles.actionIconBlue}>
                <Text style={styles.actionIconText}>+</Text>
              </View>

              <Text style={styles.actionTitle}>
                Report Missing
              </Text>

              <Text style={styles.actionText}>
                Submit a missing-person case for verification.
              </Text>

              <Text style={styles.actionArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/sighting")}
            >
              <View style={styles.actionIconBlue}>
                <Text style={styles.actionIconText}>⌖</Text>
              </View>

              <Text style={styles.actionTitle}>
                Report Sighting
              </Text>

              <Text style={styles.actionText}>
                Share a possible sighting with location and photo.
              </Text>

              <Text style={styles.actionArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/find")}
            >
              <View style={styles.actionIconBlue}>
                <Text style={styles.actionIconText}>⌕</Text>
              </View>

              <Text style={styles.actionTitle}>
                Find Missing
              </Text>

              <Text style={styles.actionText}>
                Search verified missing-person cases.
              </Text>

              <Text style={styles.actionArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => router.push("/myreports")}
            >
              <View style={styles.actionIconBlue}>
                <Text style={styles.actionIconText}>✓</Text>
              </View>

              <Text style={styles.actionTitle}>
                My Reports
              </Text>

              <Text style={styles.actionText}>
                Track the reports you have submitted.
              </Text>

              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Text style={styles.helpIconText}>i</Text>
            </View>

            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>
                Please report responsibly
              </Text>

              <Text style={styles.helpText}>
                Provide accurate information and avoid sharing
                unverified claims. Your reports are reviewed before
                cases are verified.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={logout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.logoutButtonText}>
                Logout from SafeFind
              </Text>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            SafeFind • Bringing People Home
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingCard: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingLogoBox: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingLogo: {
    width: 66,
    height: 66,
  },

  loadingIndicator: {
    marginTop: 20,
  },

  loadingTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    minHeight: 96,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logoBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  logo: {
    width: 44,
    height: 44,
  },

  headerText: {
    flex: 1,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  headerLabel: {
    color: "#DBEAFE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 3,
  },

  logoutTopButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  logoutTopText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  content: {
    alignSelf: "center",
    paddingTop: 20,
  },

  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  welcomeIconText: {
    color: "#2563EB",
    fontSize: 21,
    fontWeight: "900",
  },

  welcomeContent: {
    flex: 1,
  },

  welcomeLabel: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  welcomeName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  welcomeEmail: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },

  introCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 16,
    marginTop: 14,
  },

  introTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },

  introText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  actionCard: {
    width: "48%",
    minHeight: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 15,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  actionIconBlue: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  actionIconText: {
    color: "#2563EB",
    fontSize: 20,
    fontWeight: "900",
  },

  actionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },

  actionText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    paddingRight: 8,
  },

  actionArrow: {
    color: "#2563EB",
    fontSize: 24,
    lineHeight: 24,
    position: "absolute",
    right: 14,
    bottom: 11,
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 15,
    marginTop: 16,
  },

  helpIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  helpIconText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "900",
  },

  helpContent: {
    flex: 1,
  },

  helpTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },

  helpText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  logoutButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  logoutButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 10,
    marginTop: 16,
  },
});
