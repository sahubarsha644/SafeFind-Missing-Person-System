import {

  ActivityIndicator,

  Alert,
  Image,

  Modal,

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

const API_URL = "http\://10.141.43.231:5000";

type PendingReport = {

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

export default function AdminPendingReportsScreen() {

  const { width } = useWindowDimensions();

  const [reports, setReports] = useState<PendingReport[]>([]);

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const horizontalPadding = Math.max(

    16,

    Math.min(width * 0.06, 26)

  );

  useEffect(() => {

    loadPendingReports();

  }, []);

  const loadPendingReports = async () => {

    try {

      setLoading(true);

      const token = await getAuthToken();

      if (!token) {

        router.replace("/login");

        return;

      }

      const response = await fetch(

        `${API_URL}/api/admin/missing-persons/pending`,

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

          "Unable to load reports",

          data.message || "Please try again."

        );

        return;

      }

      setReports(data.reports || []);

    } catch (error) {

      console.error("Load pending reports error:", error);

      Alert.alert(

        "Connection error",

        "Could not connect to SafeFind server."

      );

    } finally {

      setLoading(false);

    }

  };

  const updateReport = async (

    reportId: string,

    action: "approve" | "reject"

  ) => {

    try {

      setProcessingId(reportId);

      const token = await getAuthToken();

      if (!token) {

        router.replace("/login");

        return;

      }

      const response = await fetch(

        `${API_URL}/api/admin/missing-persons/${reportId}/${action}`,

        {

          method: "PATCH",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data = await response.json();

      if (!response.ok) {

        Alert.alert(

          "Action failed",

          data.message || "Please try again."

        );

        return;

      }

      setReports((currentReports) =>

        currentReports.filter((report) => report._id !== reportId)

      );

      Alert.alert(

        action === "approve" ? "Report approved" : "Report rejected",

        data.message ||

          (action === "approve"

            ? "The report has been approved."

            : "The report has been rejected.")

      );

    } catch (error) {

      console.error("Update report error:", error);

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

          <Pressable

            style={styles.backButton}

            onPress={() => router.replace("/admin")}

          >

            <Text style={styles.backIcon}>‹</Text>

          </Pressable>

          <View style={styles.headerCenter}>

            <Text style={styles.headerEyebrow}>ADMIN PANEL</Text>

            <Text style={styles.headerTitle}>Pending Reports</Text>

            <Text style={styles.headerSubtitle}>

              Review reports waiting for verification.

            </Text>

          </View>

          <View style={styles.countBadge}>

            <Text style={styles.countValue}>{reports.length}</Text>

            <Text style={styles.countLabel}>Pending</Text>

          </View>

        </View>

        <View style={styles.sectionIntro}>

          <View>

            <Text style={styles.sectionTitle}>

              Review submissions

            </Text>

            <Text style={styles.sectionSubtitle}>

              Approve trusted reports or reject incorrect information.

            </Text>

          </View>

        </View>

        {loading ? (

          <View style={styles.stateCard}>

            <ActivityIndicator size="large" color="#2563EB" />

            <Text style={styles.stateTitle}>

              Loading reports...

            </Text>

            <Text style={styles.stateText}>

              Please wait while SafeFind retrieves pending cases.

            </Text>

          </View>

        ) : reports.length === 0 ? (

          <View style={styles.stateCard}>

            <View style={styles.emptyIcon}>

              <Text style={styles.emptyIconText}>✓</Text>

            </View>

            <Text style={styles.stateTitle}>All caught up</Text>

            <Text style={styles.stateText}>

              There are no pending missing-person reports right now.

            </Text>

          </View>

        ) : (

          <View style={styles.cards}>

            {reports.map((report) => {

              const processing = processingId === report._id;

              return (

                <View style={styles.reportCard} key={report._id}>

                  <View style={styles.cardAccent} />

                  <View style={styles.cardContent}>

                    <View style={styles.cardTopRow}>

                      <View style={styles.personIdentity}>

                        {report.photoUrl ? (

                          <Pressable

                            style={styles.photoPressable}

                            onPress={() => setSelectedPhoto(report.photoUrl || null)}

                          >

                            <Image

                              source={{ uri: report.photoUrl }}

                              style={styles.avatarImage}

                            />

                          </Pressable>

                        ) : (
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {report.fullName
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.personText}>

                          <Text style={styles.name}>

                            {report.fullName}

                          </Text>

                          <Text style={styles.caseId}>

                            Case ID: {report._id.slice(-8)}

                          </Text>

                        </View>

                      </View>

                      <View style={styles.pendingBadge}>

                        <Text style={styles.pendingBadgeText}>

                          PENDING

                        </Text>

                      </View>

                    </View>

                    <View style={styles.statsRow}>

                      <View style={styles.miniStat}>

                        <Text style={styles.miniLabel}>Age</Text>

                        <Text style={styles.miniValue}>

                          {report.age}

                        </Text>

                      </View>

                      <View style={styles.miniStat}>

                        <Text style={styles.miniLabel}>Gender</Text>

                        <Text style={styles.miniValue}>

                          {report.gender || "Not specified"}

                        </Text>

                      </View>

                      <View style={styles.miniStat}>

                        <Text style={styles.miniLabel}>Last seen</Text>

                        <Text

                          style={styles.miniValue}

                          numberOfLines={1}

                        >

                          {report.lastSeenDate}

                        </Text>

                      </View>

                    </View>

                    <View style={styles.locationBlock}>

                      <View style={styles.locationIcon}>

                        <Text style={styles.locationIconText}>⌖</Text>

                      </View>

                      <View style={styles.locationContent}>

                        <Text style={styles.detailLabel}>

                          Last seen area

                        </Text>

                        <Text style={styles.locationValue}>

                          {report.lastSeenArea}

                        </Text>

                      </View>

                    </View>

                    {report.description ? (

                      <View style={styles.descriptionBlock}>

                        <Text style={styles.detailLabel}>

                          Description

                        </Text>

                        <Text style={styles.descriptionText}>

                          {report.description}

                        </Text>

                      </View>

                    ) : null}

                    {report.reportedBy ? (

                      <View style={styles.reporterBlock}>

                        <View style={styles.reporterHeader}>

                          <Text style={styles.detailLabel}>

                            Reported by

                          </Text>

                          <View style={styles.userTag}>

                            <Text style={styles.userTagText}>USER</Text>

                          </View>

                        </View>

                        <Text style={styles.reporterName}>

                          {report.reportedBy.fullName || "N/A"}

                        </Text>

                        <View style={styles.reporterMetaRow}>

                          <Text style={styles.reporterMeta}>

                            {report.reportedBy.email || "N/A"}

                          </Text>

                          <Text style={styles.reporterDot}>•</Text>

                          <Text style={styles.reporterMeta}>

                            {report.reportedBy.phone || "N/A"}

                          </Text>

                        </View>

                      </View>

                    ) : null}

                    <View style={styles.actionRow}>

                      <Pressable

                        style={[

                          styles.approveButton,

                          processing && styles.disabledButton,

                        ]}

                        disabled={processing}

                        onPress={() =>

                          updateReport(report._id, "approve")

                        }

                      >

                        {processing && processingId === report._id ? (

                          <ActivityIndicator

                            size="small"

                            color="#FFFFFF"

                          />

                        ) : (

                          <Text style={styles.approveIcon}>✓</Text>

                        )}

                        <Text style={styles.approveText}>

                          Approve

                        </Text>

                      </Pressable>

                      <Pressable

                        style={[

                          styles.rejectButton,

                          processing && styles.disabledButton,

                        ]}

                        disabled={processing}

                        onPress={() =>

                          updateReport(report._id, "reject")

                        }

                      >

                        <Text style={styles.rejectIcon}>×</Text>

                        <Text style={styles.rejectText}>

                          Reject

                        </Text>

                      </Pressable>

                    </View>

                  </View>

                </View>

              );

            })}

          </View>

        )}



        <Modal

          visible={!!selectedPhoto}

          transparent

          animationType="fade"

          statusBarTranslucent

          onRequestClose={() => setSelectedPhoto(null)}

        >

          <View style={styles.photoModalBackdrop}>

            <Pressable

              style={styles.photoModalClose}

              onPress={() => setSelectedPhoto(null)}

            >

              <Text style={styles.photoModalCloseText}>×</Text>

            </Pressable>



            {selectedPhoto ? (

              <Image

                source={{ uri: selectedPhoto }}

                style={styles.fullscreenPhoto}

                resizeMode="contain"

              />

            ) : null}



            <Text style={styles.photoModalHint}>Tap × to close</Text>

          </View>

        </Modal>

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

  headerCenter: {

    flex: 1,

    marginHorizontal: 10,

  },

  headerEyebrow: {

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 1,

    color: "#BFDBFE",

    marginBottom: 3,

  },

  headerTitle: {

    fontSize: 23,

    lineHeight: 28,

    fontWeight: "900",

    color: "#FFFFFF",

  },

  headerSubtitle: {

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

  cards: {

    gap: 14,

  },

  reportCard: {

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

  personIdentity: {

    flexDirection: "row",

    alignItems: "center",

    flex: 1,

    paddingRight: 8,

  },

  avatar: {

    width: 48,

    height: 48,

    borderRadius: 16,

    backgroundColor: "#DBEAFE",

    justifyContent: "center",

    alignItems: "center",

  },

  avatarText: {

    color: "#2563EB",

    fontSize: 19,

    fontWeight: "900",

  },

  photoPressable: {

    borderRadius: 16,

    overflow: "hidden",

  },



  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
  },

  photoModalBackdrop: {

    flex: 1,

    backgroundColor: "rgba(2, 6, 23, 0.96)",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 18,

  },

  fullscreenPhoto: {

    width: "100%",

    height: "78%",

  },

  photoModalClose: {

    position: "absolute",

    top: 52,

    right: 20,

    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: "rgba(255,255,255,0.16)",

    justifyContent: "center",

    alignItems: "center",

    zIndex: 2,

  },

  photoModalCloseText: {

    color: "#FFFFFF",

    fontSize: 34,

    lineHeight: 38,

  },

  photoModalHint: {

    position: "absolute",

    bottom: 28,

    color: "#CBD5E1",

    fontSize: 12,

    fontWeight: "700",

  },

  personText: {

    flex: 1,

    marginLeft: 11,

  },

  name: {

    fontSize: 18,

    fontWeight: "900",

    color: "#0F172A",

  },

  caseId: {

    fontSize: 10,

    color: "#94A3B8",

    marginTop: 3,

    fontWeight: "700",

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

  statsRow: {

    flexDirection: "row",

    gap: 8,

    marginTop: 15,

  },

  miniStat: {

    flex: 1,

    minHeight: 56,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 13,

    paddingHorizontal: 10,

    paddingVertical: 8,

  },

  miniLabel: {

    fontSize: 9,

    color: "#94A3B8",

    fontWeight: "800",

  },

  miniValue: {

    fontSize: 12,

    color: "#0F172A",

    fontWeight: "800",

    marginTop: 4,

  },

  locationBlock: {

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#EFF6FF",

    borderRadius: 13,

    padding: 11,

    marginTop: 11,

  },

  locationIcon: {

    width: 34,

    height: 34,

    borderRadius: 12,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 9,

  },

  locationIconText: {

    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "900",

  },

  locationContent: {

    flex: 1,

  },

  detailLabel: {

    fontSize: 9,

    color: "#94A3B8",

    fontWeight: "800",

    textTransform: "uppercase",

    letterSpacing: 0.5,

  },

  locationValue: {

    fontSize: 12.5,

    lineHeight: 18,

    color: "#1E293B",

    fontWeight: "800",

    marginTop: 2,

  },

  descriptionBlock: {

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 13,

    backgroundColor: "#FFFFFF",

    padding: 11,

    marginTop: 11,

  },

  descriptionText: {

    fontSize: 12,

    lineHeight: 18,

    color: "#475569",

    marginTop: 4,

  },

  reporterBlock: {

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 13,

    backgroundColor: "#F8FAFC",

    padding: 11,

    marginTop: 11,

  },

  reporterHeader: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },

  userTag: {

    backgroundColor: "#E0F2FE",

    borderRadius: 999,

    paddingHorizontal: 7,

    paddingVertical: 3,

  },

  userTagText: {

    color: "#0369A1",

    fontSize: 8,

    fontWeight: "900",

  },

  reporterName: {

    fontSize: 13,

    color: "#0F172A",

    fontWeight: "900",

    marginTop: 7,

  },

  reporterMetaRow: {

    flexDirection: "row",

    alignItems: "center",

    marginTop: 4,

  },

  reporterMeta: {

    flexShrink: 1,

    fontSize: 10.5,

    color: "#64748B",

  },

  reporterDot: {

    color: "#94A3B8",

    marginHorizontal: 5,

    fontSize: 9,

  },

  actionRow: {

    flexDirection: "row",

    gap: 9,

    marginTop: 14,

  },

  approveButton: {

    flex: 1,

    minHeight: 48,

    borderRadius: 13,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    gap: 6,

  },

  approveIcon: {

    color: "#FFFFFF",

    fontSize: 17,

    fontWeight: "900",

  },

  approveText: {

    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",

  },

  rejectButton: {

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

  rejectIcon: {

    color: "#DC2626",

    fontSize: 19,

    fontWeight: "900",

  },

  rejectText: {

    color: "#DC2626",

    fontSize: 14,

    fontWeight: "800",

  },

  disabledButton: {

    opacity: 0.55,

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

  },

  dashboardButtonText: {

    color: "#334155",

    fontSize: 14,

    fontWeight: "800",

  },

});
