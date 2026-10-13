import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  getAuthToken,
  removeAuthToken,
} from "../utils/authStorage";

const API_URL = "http://10.141.43.231:5000";

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const [checking, setChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      checkLogin();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const checkLogin = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        router.replace("/onboarding");
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
        router.replace("/onboarding");
        return;
      }

      if (data.user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Login check error:", error);
      router.replace("/onboarding");
    } finally {
      setChecking(false);
    }
  };

  const logoSize = width < 360 ? 88 : width < 430 ? 104 : 118;
  const titleSize = width < 360 ? 32 : width < 430 ? 38 : 44;
  const taglineSize = width < 360 ? 14 : 16;

  if (showSplash || checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContent}>
          <View
            style={[
              styles.logoFrame,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize / 3.5,
              },
            ]}
          >
            <Image
              source={require("../../assets/images/logo.png")}
              style={{
                width: logoSize * 0.82,
                height: logoSize * 0.82,
              }}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { fontSize: titleSize }]}>
            SafeFind
          </Text>

          <View style={styles.blueLine} />

          <Text style={[styles.tagline, { fontSize: taglineSize }]}>
            Because Every Person Matters
          </Text>

          <Text style={styles.subline}>
            Report  •  Share  •  Locate  •  Reunite
          </Text>

          <View style={styles.statusCard}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.statusText}>
              Checking your session...
            </Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.bottomTitle}>
            Bringing People Home
          </Text>

          <Text style={styles.bottomText}>
            A safer way to report, locate and reconnect with missing persons.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <View style={styles.hiddenScreen} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  splashContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoFrame: {
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 5,
  },

  title: {
    color: "#0F172A",
    fontWeight: "900",
    letterSpacing: -1,
  },

  blueLine: {
    width: 54,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginTop: 10,
  },

  tagline: {
    color: "#475569",
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },

  subline: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  statusCard: {
    minWidth: 185,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#D9E6F7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 28,
  },

  statusText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  bottomSection: {
    marginHorizontal: 20,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    alignItems: "center",
  },

  bottomTitle: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },

  hiddenScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
