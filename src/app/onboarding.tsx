import {
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;

  const horizontalPadding = Math.max(
    20,
    Math.min(width * 0.065, 32)
  );

  const titleSize = isSmallPhone
    ? 27
    : width < 430
    ? 30
    : 34;

  const heroHeight = Math.min(
    Math.max(height * 0.34, 240),
    340
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: Math.max(20, height * 0.025),
            paddingBottom: Math.max(28, height * 0.04),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.brand}>SafeFind</Text>

          <Pressable
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              height: heroHeight,
            },
          ]}
        >
          <Image
            source={require("../../assets/images/img.png")}
            style={styles.onboardingImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textSection}>
          <Text
            style={[
              styles.title,
              {
                fontSize: titleSize,
                lineHeight: titleSize + 5,
              },
            ]}
          >
            Together{"\n"}We Find Them
          </Text>

          <Text style={styles.description}>
            Report, share, locate and help bring missing people home.
          </Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>+</Text>
            </View>

            <Text style={styles.featureTitle}>
              Report
            </Text>

            <Text style={styles.featureText}>
              Share a missing-person case.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>◉</Text>
            </View>

            <Text style={styles.featureTitle}>
              Locate
            </Text>

            <Text style={styles.featureText}>
              Add useful location details.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>✓</Text>
            </View>

            <Text style={styles.featureTitle}>
              Reunite
            </Text>

            <Text style={styles.featureText}>
              Help verified cases reach home.
            </Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
          </Pressable>

          <Pressable
            style={styles.outlineButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.outlineButtonText}>
              Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  brand: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  skip: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },

  heroCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  onboardingImage: {
    width: "94%",
    height: "94%",
    alignSelf: "center",
  },

  textSection: {
    alignItems: "center",
    marginTop: 22,
  },

  title: {
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  description: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 340,
  },

  featureRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },

  featureCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 11,
  },

  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  featureIconText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "900",
  },

  featureTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  featureText: {
    color: "#64748B",
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },

  bottomArea: {
    marginTop: 24,
  },

  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  outlineButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  outlineButtonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
});
