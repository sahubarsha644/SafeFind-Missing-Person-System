import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeAuthToken } from "../utils/authStorage";

export default function AdminScreen() {
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState({
    pendingCases: 0,
    pendingSightings: 0,
    verifiedCases: 0,
    totalCases: 0,
    doneCases: 0,
  });

  const API_URL = "http://10.141.43.231:5000";

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await import("../utils/authStorage").then((m) =>
        m.getAuthToken()
      );

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats({
          pendingCases: data.stats.pendingCases || 0,
          pendingSightings: data.stats.pendingSightings || 0,
          verifiedCases: data.stats.verifiedCases || 0,
          totalCases: data.stats.totalCases || 0,
          doneCases: data.stats.doneCases || 0,
        });
      }
    } catch (error) {
      console.error("Load admin stats error:", error);
    }
  };
  const isSmallPhone = width < 360;
  const horizontalPadding = Math.max(18, Math.min(width * 0.06, 26));

  const handleLogout = async () => {
    await removeAuthToken();
    router.replace("/login");
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: handleLogout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.blueHeader,
            {
              marginHorizontal: -horizontalPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>SafeFind</Text>
              <Text style={styles.adminLabel}>ADMIN PORTAL</Text>
            </View>
          </View>

          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>A</Text>
          </View>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSmall}>WELCOME BACK</Text>

          <Text
            style={[
              styles.title,
              { fontSize: isSmallPhone ? 25 : 30 },
            ]}
          >
            Admin Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Manage missing-person cases, sightings and verification.
          </Text>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewContent}>
            <Text style={styles.overviewEyebrow}>ADMIN CONTROL CENTER</Text>
            <Text style={styles.overviewTitle}>
              Keep every case moving forward.
            </Text>
            <Text style={styles.overviewSubtitle}>
              Review submissions, sightings and evidence before
              they become visible to the community.
            </Text>
          </View>

          <View style={styles.checkBadge}>
            <Text style={styles.checkBadgeText}>✓</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push("/admin_pending")}
          >
            <View style={styles.statIconBlue}>
              <Text style={styles.statIconText}>!</Text>
            </View>
            <Text style={styles.statNumber}>{stats.pendingCases}</Text>
            <Text style={styles.statLabel}>Pending reports</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push("/admin_sightings")}
          >
            <View style={styles.statIconBlueLight}>
              <Text style={styles.statIconText}>⌖</Text>
            </View>
            <Text style={styles.statNumber}>{stats.pendingSightings}</Text>
            <Text style={styles.statLabel}>Pending sightings</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push("/admin_verified")}
          >
            <View style={styles.statIconGreen}>
              <Text style={styles.statIconText}>✓</Text>
            </View>
            <Text style={styles.statNumber}>{stats.verifiedCases}</Text>
            <Text style={styles.statLabel}>Verified cases</Text>
          </Pressable>

          <View style={styles.statCard}>
            <View style={styles.statIconTotal}>
              <Text style={styles.statIconText}>#</Text>
            </View>
            <Text style={styles.statNumber}>{stats.totalCases}</Text>
            <Text style={styles.statLabel}>Total cases</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconDone}>
              <Text style={styles.statIconText}>✓</Text>
            </View>
            <Text style={styles.statNumber}>{stats.doneCases}</Text>
            <Text style={styles.statLabel}>Done cases</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Case Management</Text>
          <Text style={styles.viewAll}>View all</Text>
        </View>

        <View style={styles.actionList}>
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/admin_pending")}
          >
            <View style={[styles.actionAccent, styles.accentBlue]} />

            <View style={[styles.actionIcon, styles.actionIconBlue]}>
              <Text style={styles.actionIconText}>!</Text>
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Pending Reports</Text>
              <Text style={styles.actionDescription}>
                Review new missing-person submissions.
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/admin_sightings")}
          >
            <View style={[styles.actionAccent, styles.accentLightBlue]} />

            <View style={[styles.actionIcon, styles.actionIconLightBlue]}>
              <Text style={styles.actionIconText}>⌖</Text>
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Pending Sightings</Text>
              <Text style={styles.actionDescription}>
                Check locations, photos and submitted evidence.
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push("/admin_verified")}
          >
            <View style={[styles.actionAccent, styles.accentGreen]} />

            <View style={[styles.actionIcon, styles.actionIconGreen]}>
              <Text style={styles.actionIconText}>✓</Text>
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verified Reports</Text>
              <Text style={styles.actionDescription}>
                View approved cases visible to the community.
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.workflowHeader}>
          <Text style={styles.sectionTitle}>Verification Workflow</Text>
        </View>

        <View style={styles.workflowCard}>
          <View style={styles.workflowStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review</Text>
              <Text style={styles.stepSubtitle}>
                Check submitted case details.
              </Text>
            </View>
          </View>

          <View style={styles.workflowLine} />

          <View style={styles.workflowStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify</Text>
              <Text style={styles.stepSubtitle}>
                Approve reliable information.
              </Text>
            </View>
          </View>

          <View style={styles.workflowLine} />

          <View style={styles.workflowStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Community</Text>
              <Text style={styles.stepSubtitle}>
                Keep verified cases moving.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogoutPress}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.footerText}>
          SafeFind • Admin control center
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },

  page: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },

  container: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 32,
  },

  blueHeader: {
    minHeight: 96,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    marginBottom: 22,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logoImage: {
    width: 54,
    height: 54,
    marginRight: 11,
  },

  brandTextWrap: {
    flex: 1,
  },

  brandName: {
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },

  adminLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#DBEAFE",
    marginTop: 2,
  },

  adminBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  adminBadgeText: {
    color: "#2563EB",
    fontSize: 22,
    fontWeight: "900",
  },

  introSection: {
    marginBottom: 18,
  },

  introSmall: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: "#2563EB",
    marginBottom: 4,
  },

  title: {
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 5,
  },

  overviewCard: {
    minHeight: 166,
    borderRadius: 24,
    backgroundColor: "#1D4ED8",
    flexDirection: "row",
    alignItems: "center",
    padding: 19,
    marginBottom: 24,
  },

  overviewContent: {
    flex: 1,
    paddingRight: 12,
  },

  overviewEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#BFDBFE",
  },

  overviewTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 6,
  },

  overviewSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: "#DBEAFE",
    marginTop: 6,
  },

  checkBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  checkBadgeText: {
    color: "#2563EB",
    fontSize: 30,
    fontWeight: "900",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  viewAll: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 24,
  },

  statCard: {
    width: "31%",
    flexGrow: 1,
    minHeight: 118,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 12,
  },

  statIconBlue: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statIconBlueLight: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#BFDBFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statIconGreen: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statIconText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  statIconTotal: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statIconDone: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statNumber: {
    color: "#2563EB",
    fontSize: 21,
    fontWeight: "900",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  actionList: {
    gap: 11,
    marginBottom: 24,
  },

  actionCard: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 14,
    overflow: "hidden",
  },

  actionAccent: {
    width: 5,
    alignSelf: "stretch",
    borderRadius: 3,
    marginRight: 12,
  },

  accentBlue: {
    backgroundColor: "#2563EB",
  },

  accentLightBlue: {
    backgroundColor: "#60A5FA",
  },

  accentGreen: {
    backgroundColor: "#22C55E",
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionIconBlue: {
    backgroundColor: "#2563EB",
  },

  actionIconLightBlue: {
    backgroundColor: "#DBEAFE",
  },

  actionIconGreen: {
    backgroundColor: "#DCFCE7",
  },

  actionIconText: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  actionDescription: {
    fontSize: 10.5,
    lineHeight: 15,
    color: "#64748B",
    marginTop: 3,
  },

  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  arrowText: {
    fontSize: 23,
    lineHeight: 25,
    color: "#2563EB",
    marginTop: -1,
  },

  workflowHeader: {
    marginTop: 0,
  },

  workflowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 15,
    marginBottom: 20,
  },

  workflowStep: {
    flexDirection: "row",
    alignItems: "center",
  },

  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#0F172A",
  },

  stepSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },

  workflowLine: {
    width: 2,
    height: 13,
    backgroundColor: "#BFDBFE",
    marginLeft: 16,
    marginVertical: 3,
  },

  logoutButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  logoutIcon: {
    fontSize: 17,
    color: "#DC2626",
    fontWeight: "900",
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },

  footerText: {
    textAlign: "center",
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 13,
  },
});
