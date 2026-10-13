import { useEffect, useState } from "react";

import {

  ActivityIndicator,
  Alert,
  Image,

  Modal,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  View,

} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import { getAuthToken } from "../utils/authStorage";

const API_URL = "http://10.141.43.231:5000";

type VerifiedReport = {

  _id: string;

  fullName: string;

  age: number;

  gender?: string;

  photoUrl?: string;

  lastSeenArea: string;

  lastSeenDate: string;

  description?: string;

  status: string;

  verificationStatus: string;

  reportedBy?: {

    fullName?: string;

    email?: string;

    phone?: string;

  };

};

type CaseSighting = {
  _id: string;
  location: string;
  date: string;
  description?: string;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  createdAt?: string;
  reportedBy?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
};

export default function AdminVerifiedDetailScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const [report, setReport] = useState<VerifiedReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [sightings, setSightings] = useState<CaseSighting[]>([]);
  const [sightingsLoading, setSightingsLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {

    loadReport();
    if (id) {
      loadSightings();
    }

  }, [id]);

  const loadReport = async () => {

    try {

      setLoading(true);

      const token = await getAuthToken();

      if (!token) {

        router.replace("/login");

        return;

      }

      const response = await fetch(

        `${API_URL}/api/admin/missing-persons/verified`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(

          data.message || "Failed to load report."

        );

      }

      const selected = (data.reports || []).find(

        (item: VerifiedReport) => item._id === id

      );

      setReport(selected || null);

    } catch (error) {

      console.error("Load verified detail error:", error);

    } finally {

      setLoading(false);

    }

  };

  const loadSightings = async () => {
    try {
      setSightingsLoading(true);

      const token = await getAuthToken();

      if (!token || !id) {
        setSightings([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/missing-persons/${id}/sightings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Load case sightings error:",
          data.message || "Failed to load sightings."
        );
        setSightings([]);
        return;
      }

      setSightings(data.sightings || []);
    } catch (error) {
      console.error("Load case sightings error:", error);
      setSightings([]);
    } finally {
      setSightingsLoading(false);
    }
  };

  const updateCaseStatus = async (newStatus: "found" | "closed") => {
    try {
      if (!report?._id) {
        return;
      }

      const token = await getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      setProcessingStatus(true);

      const response = await fetch(
        `${API_URL}/api/admin/missing-persons/${report._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update case status."
        );
      }

      setReport((current) =>
        current
          ? {
              ...current,
              status: newStatus,
            }
          : current
      );

      Alert.alert(
        newStatus === "found" ? "Case marked as found" : "Case closed",
        newStatus === "found"
          ? "This missing-person case is now marked as found."
          : "This case has been closed."
      );
    } catch (error) {
      console.error("Update case status error:", error);
      Alert.alert(
        "Update failed",
        error instanceof Error
          ? error.message
          : "Could not update the case."
      );
    } finally {
      setProcessingStatus(false);
    }
  };

  if (loading) {

    return (

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.centerState}>

          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.stateTitle}>Loading case...</Text>

          <Text style={styles.stateText}>

            Please wait while SafeFind loads the case details.

          </Text>

        </View>

      </SafeAreaView>

    );

  }

  if (!report) {

    return (

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.centerState}>

          <Text style={styles.stateTitle}>Case not found</Text>

          <Text style={styles.stateText}>

            The selected verified case could not be loaded.

          </Text>

          <Pressable

            style={styles.backToListButton}

            onPress={() => router.replace("/admin_verified")}

          >

            <Text style={styles.backToListText}>

              Back to Verified Cases

            </Text>

          </Pressable>

        </View>

      </SafeAreaView>

    );

  }

  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView

        style={styles.page}

        contentContainerStyle={styles.container}

        showsVerticalScrollIndicator={false}

      >

        <View style={styles.header}>

          <Pressable

            style={styles.backButton}

            onPress={() => router.back()}

          >

            <Text style={styles.backIcon}>‹</Text>

          </Pressable>

          <View style={styles.headerText}>

            <Text style={styles.eyebrow}>VERIFIED CASE</Text>

            <Text style={styles.title}>Case Details</Text>

            <Text style={styles.caseId}>

              #{report._id.slice(-8)}

            </Text>

          </View>

          <View style={styles.verifiedBadge}>

            <Text style={styles.verifiedText}>VERIFIED</Text>

          </View>

        </View>

        <View style={styles.personCard}>

          {report.photoUrl ? (
            <Pressable
              onPress={() => setSelectedPhoto(report.photoUrl || null)}
              style={styles.photoPressable}
            >
              <Image
                source={{ uri: report.photoUrl }}
                style={styles.personPhoto}
              />
              <View style={styles.photoHint}>
                <Text style={styles.photoHintText}>Tap to view</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {report.fullName.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{report.fullName}</Text>

          <Text style={styles.meta}>

            Age {report.age} •{" "}

            {report.gender || "Gender not specified"}

          </Text>

        </View>

        <Text style={styles.sectionTitle}>Case Information</Text>

        <View style={styles.infoCard}>

          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>

              <Text style={styles.infoIconText}>⌖</Text>

            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>Last seen area</Text>

              <Text style={styles.infoValue}>

                {report.lastSeenArea}

              </Text>

            </View>

          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>

              <Text style={styles.infoIconText}>◷</Text>

            </View>

            <View style={styles.infoContent}>

              <Text style={styles.infoLabel}>Last seen date</Text>

              <Text style={styles.infoValue}>

                {report.lastSeenDate}

              </Text>

            </View>

          </View>

        </View>

        {report.description ? (

          <>

            <Text style={styles.sectionTitle}>Description</Text>

            <View style={styles.descriptionCard}>

              <Text style={styles.descriptionText}>

                {report.description}

              </Text>

            </View>

          </>

        ) : null}

        <Text style={styles.sectionTitle}>Reported By</Text>

        <View style={styles.reporterCard}>

          <Text style={styles.reporterName}>

            {report.reportedBy?.fullName || "N/A"}

          </Text>

          <Text style={styles.reporterDetail}>

            {report.reportedBy?.email || "N/A"}

          </Text>

          <Text style={styles.reporterDetail}>

            {report.reportedBy?.phone || "N/A"}

          </Text>

        </View>

        <Text style={styles.sectionTitle}>Sightings for This Case</Text>

        {sightingsLoading ? (
          <View style={styles.sightingStateCard}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.sightingStateText}>Loading sightings...</Text>
          </View>
        ) : sightings.length === 0 ? (
          <View style={styles.sightingStateCard}>
            <Text style={styles.sightingStateTitle}>No sightings submitted</Text>
            <Text style={styles.sightingStateText}>
              No user sighting has been submitted for this case yet.
            </Text>
          </View>
        ) : (
          <View style={styles.sightingsList}>
            {sightings.map((sighting) => (
              <View key={sighting._id} style={styles.sightingCard}>
                <View style={styles.sightingHeaderRow}>
                  <View style={styles.sightingStatusPill}>
                    <Text style={styles.sightingStatusText}>
                      {(sighting.status || "pending").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.sightingId}>
                    #{sighting._id.slice(-6).toUpperCase()}
                  </Text>
                </View>

                {sighting.photoUrl ? (
                  <Pressable
                    style={styles.sightingPhotoButton}
                    onPress={() => setSelectedPhoto(sighting.photoUrl || null)}
                  >
                    <Image
                      source={{ uri: sighting.photoUrl }}
                      style={styles.sightingPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.sightingPhotoHint}>
                      <Text style={styles.sightingPhotoHintText}>Tap to view</Text>
                    </View>
                  </Pressable>
                ) : null}

                <View style={styles.sightingInfoBlock}>
                  <Text style={styles.sightingLabel}>SUBMITTED BY</Text>
                  <Text style={styles.sightingValue}>
                    {sighting.reportedBy?.fullName || "N/A"}
                  </Text>

                  <Text style={styles.sightingLabel}>LOCATION</Text>
                  <Text style={styles.sightingValue}>
                    {sighting.location || "Not provided"}
                  </Text>

                  <Text style={styles.sightingLabel}>DATE</Text>
                  <Text style={styles.sightingValue}>
                    {sighting.date || "Not provided"}
                  </Text>

                  {!!sighting.description && (
                    <>
                      <Text style={styles.sightingLabel}>DESCRIPTION</Text>
                      <Text style={styles.sightingDescription}>
                        {sighting.description}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Status</Text>

        <View style={styles.statusCard}>

          <View style={styles.statusItem}>

            <Text style={styles.statusLabel}>Case status</Text>

            <Text style={styles.statusValue}>

              {report.status}

            </Text>

          </View>

          <View style={styles.statusItem}>

            <Text style={styles.statusLabel}>

              Verification status

            </Text>

            <Text style={styles.statusValue}>

              {report.verificationStatus}

            </Text>

          </View>

        </View>

        {report.status?.toLowerCase() === "verified" ? (
          <Pressable
            style={styles.foundButton}
            onPress={() =>
              Alert.alert(
                "Mark case as found?",
                "Confirm that this missing person has been located.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Confirm Found",
                    onPress: () => updateCaseStatus("found"),
                  },
                ]
              )
            }
            disabled={processingStatus}
          >
            {processingStatus ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.foundButtonText}>MARK AS FOUND</Text>
            )}
          </Pressable>
        ) : null}

        {report.status?.toLowerCase() === "found" ? (
          <Pressable
            style={styles.closeCaseButton}
            onPress={() =>
              Alert.alert(
                "Close case?",
                "This will mark the found case as closed.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Close Case",
                    style: "destructive",
                    onPress: () => updateCaseStatus("closed"),
                  },
                ]
              )
            }
            disabled={processingStatus}
          >
            {processingStatus ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.closeCaseButtonText}>CLOSE CASE</Text>
            )}
          </Pressable>
        ) : null}

        {report.status?.toLowerCase() === "closed" ? (
          <View style={styles.closedCaseBanner}>
            <Text style={styles.closedCaseTitle}>CASE CLOSED ✓</Text>
            <Text style={styles.closedCaseText}>
              This case has been completed and is no longer active.
            </Text>
          </View>
        ) : null}

        <Pressable

          style={styles.backToListButton}

          onPress={() => router.replace("/admin_verified")}

        >

          <Text style={styles.backToListText}>

            Back to Verified Cases

          </Text>

        </Pressable>

      </ScrollView>

      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoModal}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Text style={styles.modalCloseText}>×</Text>
          </Pressable>

          {selectedPhoto ? (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullScreenPhoto}
              resizeMode="contain"
            />
          ) : null}

          <Text style={styles.modalHint}>Tap × to close</Text>
        </View>
      </Modal>

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

    paddingHorizontal: 18,

    paddingTop: 14,

    paddingBottom: 30,

  },

  header: {

    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: 18,

  },

  backButton: {

    width: 42,

    height: 42,

    borderRadius: 13,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 11,

  },

  backIcon: {

    fontSize: 30,

    lineHeight: 30,

    color: "#0F172A",

    marginTop: -3,

  },

  headerText: {

    flex: 1,

  },

  eyebrow: {

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 1.1,

    color: "#2563EB",

  },

  title: {

    fontSize: 25,

    lineHeight: 30,

    fontWeight: "900",

    color: "#0F172A",

    marginTop: 2,

  },

  caseId: {

    fontSize: 10,

    color: "#64748B",

    marginTop: 2,

    fontWeight: "700",

  },

  verifiedBadge: {

    backgroundColor: "#DCFCE7",

    borderRadius: 999,

    paddingHorizontal: 9,

    paddingVertical: 5,

    marginLeft: 8,

  },

  verifiedText: {

    color: "#15803D",

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 0.5,

  },

  personCard: {

    backgroundColor: "#2563EB",

    borderRadius: 22,

    padding: 22,

    alignItems: "center",

    marginBottom: 24,

  },

  avatar: {

    width: 72,

    height: 72,

    borderRadius: 22,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

  },

  avatarText: {

    fontSize: 28,

    fontWeight: "900",

    color: "#2563EB",

  },

  personPhoto: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },

  photoPressable: {
    alignItems: "center",
    justifyContent: "center",
  },

  photoHint: {
    position: "absolute",
    bottom: 7,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  photoHintText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    backgroundColor: "rgba(15, 23, 42, 0.70)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  photoModal: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  fullScreenPhoto: {
    width: "100%",
    height: "78%",
  },

  modalCloseButton: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "700",
    marginTop: -2,
  },

  modalHint: {
    position: "absolute",
    bottom: 42,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },

  name: {

    fontSize: 24,

    lineHeight: 29,

    color: "#FFFFFF",

    fontWeight: "900",

    marginTop: 12,

    textAlign: "center",

  },

  meta: {

    fontSize: 12,

    color: "#DBEAFE",

    marginTop: 4,

  },

  sectionTitle: {

    fontSize: 16,

    fontWeight: "900",

    color: "#0F172A",

    marginBottom: 10,

  },

  infoCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 15,

    marginBottom: 20,

  },

  infoRow: {

    flexDirection: "row",

    alignItems: "center",

  },

  infoIcon: {

    width: 38,

    height: 38,

    borderRadius: 12,

    backgroundColor: "#DBEAFE",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 11,

  },

  infoIconText: {

    color: "#2563EB",

    fontSize: 17,

    fontWeight: "900",

  },

  infoContent: {

    flex: 1,

  },

  infoLabel: {

    fontSize: 9,

    color: "#94A3B8",

    fontWeight: "800",

  },

  infoValue: {

    fontSize: 13,

    color: "#334155",

    fontWeight: "700",

    marginTop: 2,

    lineHeight: 18,

  },

  separator: {

    height: 1,

    backgroundColor: "#E2E8F0",

    marginVertical: 14,

  },

  descriptionCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 16,

    marginBottom: 20,

  },

  descriptionText: {

    fontSize: 13,

    lineHeight: 20,

    color: "#475569",

  },

  reporterCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 15,

    marginBottom: 20,

  },

  reporterName: {

    fontSize: 15,

    fontWeight: "900",

    color: "#0F172A",

  },

  reporterDetail: {

    fontSize: 12,

    color: "#64748B",

    marginTop: 5,

  },

  sightingStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 20,
    alignItems: "center",
    marginBottom: 4,
  },

  sightingStateTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 5,
  },

  sightingStateText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  sightingsList: {
    gap: 12,
    marginBottom: 4,
  },

  sightingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 14,
  },

  sightingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sightingStatusPill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  sightingStatusText: {
    color: "#2563EB",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  sightingId: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },

  sightingPhotoButton: {
    width: "100%",
    height: 190,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
    marginBottom: 12,
    position: "relative",
  },

  sightingPhoto: {
    width: "100%",
    height: "100%",
  },

  sightingPhotoHint: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(15,23,42,0.72)",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  sightingPhotoHintText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  sightingInfoBlock: {
    gap: 6,
  },

  sightingLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 3,
  },

  sightingValue: {
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },

  sightingDescription: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },

  statusCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 15,

    marginBottom: 20,

  },

  statusItem: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingVertical: 5,

  },

  statusLabel: {

    fontSize: 11,

    color: "#64748B",

    fontWeight: "700",

  },

  statusValue: {

    fontSize: 11,

    color: "#2563EB",

    fontWeight: "900",

    textTransform: "uppercase",

  },

  centerState: {

    flex: 1,

    backgroundColor: "#EEF4FF",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 30,

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

  foundButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  foundButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  closeCaseButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  closeCaseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  closedCaseBanner: {
    marginTop: 14,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 14,
  },

  closedCaseTitle: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "900",
  },

  closedCaseText: {
    color: "#166534",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  backToListButton: {

    minHeight: 50,

    borderRadius: 13,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 4,

  },

  backToListText: {

    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",

  },

});
