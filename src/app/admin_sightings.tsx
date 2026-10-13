import {
  ActivityIndicator,
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
import { useEffect, useState } from "react";
import { getAuthToken } from "../utils/authStorage";

const API_URL = "http://10.141.43.231:5000";

type Sighting = {
  _id: string;
  location: string;
  date: string;
  description?: string;
  photoUrl?: string | null;
  status: string;
  missingPersonId: {
    _id: string;
    fullName: string;
    age: number;
    gender?: string;
    lastSeenArea: string;
    lastSeenDate: string;
  };
  reportedBy: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
};

export default function AdminSightingsScreen() {
  const { width } = useWindowDimensions();

  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const horizontalPadding = Math.max(
    16,
    Math.min(width * 0.06, 26)
  );

  useEffect(() => {
    loadSightings();
  }, []);

  const loadSightings = async () => {
    try {
      setLoading(true);

      const token = await getAuthToken();

      if (!token) {
        Alert.alert("Login required", "Please login again.");
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/sightings/pending`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to load sightings",
          data.message || "Failed to load sightings."
        );
        return;
      }

      setSightings(data.sightings || []);
    } catch (error) {
      console.error("Load sightings error:", error);
      Alert.alert(
        "Connection error",
        "Could not connect to SafeFind server."
      );
    } finally {
      setLoading(false);
    }
  };

  const reviewSighting = async (
    sightingId: string,
    action: "reviewed" | "dismissed"
  ) => {
    try {
      setProcessingId(sightingId);

      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/sightings/${sightingId}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Review failed",
          data.message || "Please try again."
        );
        return;
      }

      setSightings((currentSightings) =>
        currentSightings.filter(
          (sighting) => sighting._id !== sightingId
        )
      );

      Alert.alert(
        action === "reviewed"
          ? "Sighting reviewed"
          : "Sighting dismissed",
        data.message ||
          (action === "reviewed"
            ? "Sighting marked as reviewed."
            : "Sighting dismissed.")
      );
    } catch (error) {
      console.error("Review sighting error:", error);
      Alert.alert(
        "Connection error",
        "Could not connect to SafeFind server."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
          },
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
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/admin")}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMIN PANEL</Text>
            <Text style={styles.title}>Pending Sightings</Text>
            <Text style={styles.subtitle}>
              Review locations, evidence and community submissions.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countValue}>{sightings.length}</Text>
            <Text style={styles.countLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.sectionIntro}>
          <Text style={styles.sectionTitle}>
            Review sightings
          </Text>
          <Text style={styles.sectionSubtitle}>
            Check each sighting before it is marked as reviewed or
            dismissed.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.stateTitle}>
              Loading sightings...
            </Text>
            <Text style={styles.stateText}>
              Please wait while SafeFind retrieves the latest
              submissions.
            </Text>
          </View>
        ) : sightings.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>

            <Text style={styles.stateTitle}>
              No pending sightings
            </Text>

            <Text style={styles.stateText}>
              There are currently no sighting reports waiting for
              review.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sightings.map((sighting) => {
              const processing = processingId === sighting._id;

              return (
                <View key={sighting._id} style={styles.sightingCard}>
                  <View style={styles.cardAccent} />

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.caseIdentity}>
                        <View style={styles.personAvatar}>
                          <Text style={styles.personAvatarText}>
                            {sighting.missingPersonId?.fullName
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || "?"}
                          </Text>
                        </View>

                        <View style={styles.personText}>
                          <Text style={styles.personName}>
                            {sighting.missingPersonId?.fullName ||
                              "Unknown person"}
                          </Text>

                          <Text style={styles.personMeta}>
                            Age {sighting.missingPersonId?.age ?? "N/A"} •{" "}
                            {sighting.missingPersonId?.gender ||
                              "Gender not specified"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>
                          PENDING
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.caseId}>
                      Case ID: {sighting.missingPersonId?._id?.slice(-8)}
                    </Text>

                    <View style={styles.alertStrip}>
                      <Text style={styles.alertStripText}>
                        Possible sighting reported for this case
                      </Text>
                    </View>

                    <View style={styles.infoGrid}>
                      <View style={styles.infoTile}>
                        <View style={styles.infoTileIcon}>
                          <Text style={styles.infoTileIconText}>⌖</Text>
                        </View>
                        <Text style={styles.infoTileLabel}>
                          Last seen
                        </Text>
                        <Text
                          style={styles.infoTileValue}
                          numberOfLines={2}
                        >
                          {sighting.missingPersonId?.lastSeenArea ||
                            "N/A"}
                        </Text>
                      </View>

                      <View style={styles.infoTile}>
                        <View style={styles.infoTileIcon}>
                          <Text style={styles.infoTileIconText}>◷</Text>
                        </View>
                        <Text style={styles.infoTileLabel}>
                          Case date
                        </Text>
                        <Text
                          style={styles.infoTileValue}
                          numberOfLines={2}
                        >
                          {sighting.missingPersonId?.lastSeenDate ||
                            "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sightingLocation}>
                      <View style={styles.locationIcon}>
                        <Text style={styles.locationIconText}>⌖</Text>
                      </View>

                      <View style={styles.locationContent}>
                        <Text style={styles.detailLabel}>
                          Sighting location
                        </Text>
                        <Text style={styles.locationValue}>
                          {sighting.location || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>
                        Sighting date
                      </Text>
                      <Text style={styles.dateValue}>
                        {sighting.date || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>
                        Description
                      </Text>
                      <Text style={styles.detailText}>
                        {sighting.description ||
                          "No description provided."}
                      </Text>
                    </View>

                    <Text style={styles.sectionLabel}>
                      Photo Evidence
                    </Text>

                    {sighting.photoUrl ? (
                      <View style={styles.photoCard}>
                        <Image
                          source={{ uri: sighting.photoUrl }}
                          style={styles.photo}
                          resizeMode="cover"
                        />
                        <View style={styles.photoBadge}>
                          <Text style={styles.photoBadgeText}>
                            EVIDENCE
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.noPhotoCard}>
                        <View style={styles.noPhotoIcon}>
                          <Text style={styles.noPhotoIconText}>○</Text>
                        </View>
                        <View style={styles.noPhotoContent}>
                          <Text style={styles.noPhotoTitle}>
                            No photo evidence
                          </Text>
                          <Text style={styles.noPhotoText}>
                            This sighting was submitted without a photo.
                          </Text>
                        </View>
                      </View>
                    )}

                    <Text style={styles.sectionLabel}>
                      Reported By
                    </Text>

                    <View style={styles.reporterCard}>
                      <Text style={styles.reporterName}>
                        {sighting.reportedBy?.fullName || "N/A"}
                      </Text>

                      <Text style={styles.reporterMeta}>
                        {sighting.reportedBy?.email || "N/A"}
                      </Text>

                      <Text style={styles.reporterMeta}>
                        {sighting.reportedBy?.phone || "N/A"}
                      </Text>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>
                        Current status
                      </Text>

                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {sighting.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        style={[
                          styles.reviewButton,
                          processing && styles.disabledButton,
                        ]}
                        disabled={processing}
                        onPress={() =>
                          reviewSighting(
                            sighting._id,
                            "reviewed"
                          )
                        }
                      >
                        {processing ? (
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={styles.actionIcon}>✓</Text>
                        )}

                        <Text style={styles.reviewText}>
                          Mark Reviewed
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.dismissButton,
                          processing && styles.disabledButton,
                        ]}
                        disabled={processing}
                        onPress={() =>
                          reviewSighting(
                            sighting._id,
                            "dismissed"
                          )
                        }
                      >
                        <Text style={styles.dismissIcon}>×</Text>
                        <Text style={styles.dismissText}>
                          Dismiss
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={styles.privateNote}>
                      Private admin information • Visible only to
                      authorized staff.
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          style={styles.dashboardButton}
          onPress={() => router.replace("/admin")}
        >
          <Text style={styles.dashboardButtonText}>
            Back to Admin Dashboard
          </Text>
        </Pressable>
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
    paddingTop: 0,
    paddingBottom: 30,
  },

  blueHeader: {
    minHeight: 118,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 30,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
    marginHorizontal: 10,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#BFDBFE",
    marginBottom: 3,
  },

  title: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#DBEAFE",
    marginTop: 3,
  },

  countBadge: {
    minWidth: 60,
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  countValue: {
    fontSize: 19,
    lineHeight: 22,
    fontWeight: "900",
    color: "#2563EB",
  },

  countLabel: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "800",
    marginTop: 1,
  },

  sectionIntro: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#64748B",
    marginTop: 3,
  },

  list: {
    gap: 14,
  },

  sightingCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardAccent: {
    width: 5,
    backgroundColor: "#2563EB",
  },

  cardContent: {
    flex: 1,
    padding: 15,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  caseIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },

  personAvatar: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  personAvatarText: {
    color: "#2563EB",
    fontSize: 19,
    fontWeight: "900",
  },

  personText: {
    flex: 1,
    marginLeft: 11,
  },

  personName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  personMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  pendingBadgeText: {
    color: "#2563EB",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  caseId: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: 8,
  },

  alertStrip: {
    backgroundColor: "#EFF6FF",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 11,
  },

  alertStripText: {
    fontSize: 10.5,
    color: "#1D4ED8",
    fontWeight: "800",
  },

  infoGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  infoTile: {
    flex: 1,
    minHeight: 75,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },

  infoTileIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  infoTileIconText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "900",
  },

  infoTileLabel: {
    fontSize: 8.5,
    color: "#94A3B8",
    fontWeight: "800",
  },

  infoTileValue: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 15,
  },

  sightingLocation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 13,
    padding: 11,
    marginTop: 11,
  },

  locationIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  locationIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  locationContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  locationValue: {
    fontSize: 12.5,
    color: "#1E293B",
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 18,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 11,
    paddingHorizontal: 2,
  },

  dateLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
  },

  dateValue: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "800",
  },

  detailBlock: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    padding: 11,
    marginTop: 11,
  },

  detailText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    marginTop: 4,
  },

  sectionLabel: {
    fontSize: 10,
    color: "#334155",
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 7,
  },

  photoCard: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#D9E6F7",
    position: "relative",
  },

  photo: {
    width: "100%",
    height: 220,
  },

  photoBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(15,23,42,0.78)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  photoBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  noPhotoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    padding: 12,
  },

  noPhotoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  noPhotoIconText: {
    color: "#2563EB",
    fontSize: 20,
    fontWeight: "800",
  },

  noPhotoContent: {
    flex: 1,
  },

  noPhotoTitle: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "900",
  },

  noPhotoText: {
    fontSize: 10.5,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 2,
  },

  reporterCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    padding: 12,
  },

  reporterName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  reporterMeta: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 4,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  statusLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },

  statusBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusText: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  reviewButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  actionIcon: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  reviewText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  dismissButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  dismissIcon: {
    color: "#DC2626",
    fontSize: 19,
    fontWeight: "900",
  },

  dismissText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },

  privateNote: {
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
  },

  stateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconText: {
    color: "#15803D",
    fontSize: 30,
    fontWeight: "900",
  },

  stateTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 14,
  },

  stateText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
  },

  dashboardButton: {
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
  },

  dashboardButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
});
