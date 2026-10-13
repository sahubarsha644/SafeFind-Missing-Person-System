import { useEffect, useState } from "react";

import {

  ActivityIndicator,

  Image,

  Modal,

  Pressable,

  SafeAreaView,

  ScrollView,

  StyleSheet,

  Text,

  useWindowDimensions,

  View,

} from "react-native";

import { router } from "expo-router";

import { getAuthToken } from "../utils/authStorage";



const API_URL = "http://10.141.43.231:5000";



export default function MyReportsScreen() {

  const { width } = useWindowDimensions();



  const [reports, setReports] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);



  useEffect(() => {

    loadReports();

  }, []);



  const loadReports = async () => {

    try {

      setLoading(true);



      const token = await getAuthToken();



      if (!token) {

        alert("Please login first");

        router.replace("/login");

        return;

      }



      const response = await fetch(

        `${API_URL}/api/missing-persons/my-reports`,

        {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );



      const data = await response.json();



      if (!response.ok) {

        alert(data.message || "Could not load your reports");

        return;

      }



      setReports(data.reports || []);

    } catch (error) {

      alert("Could not connect to SafeFind server");

    } finally {

      setLoading(false);

    }

  };



  const getStatusStyle = (status: string) => {

    switch (status?.toLowerCase()) {

      case "verified":

        return {

          backgroundColor: "#EFF6FF",

          textColor: "#2563EB",

        };

      case "found":

        return {

          backgroundColor: "#F0FDF4",

          textColor: "#15803D",

        };

      case "closed":

        return {

          backgroundColor: "#F1F5F9",

          textColor: "#475569",

        };

      default:

        return {

          backgroundColor: "#FFF7ED",

          textColor: "#C2410C",

        };

    }

  };



  const getVerificationStyle = (status: string) => {

    switch (status?.toLowerCase()) {

      case "approved":

        return {

          backgroundColor: "#F0FDF4",

          textColor: "#15803D",

        };

      case "rejected":

        return {

          backgroundColor: "#FEF2F2",

          textColor: "#DC2626",

        };

      default:

        return {

          backgroundColor: "#FFF7ED",

          textColor: "#C2410C",

        };

    }

  };



  const contentWidth = Math.min(width - 32, 640);



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

              paddingHorizontal: Math.max(18, (width - contentWidth) / 2),

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



            <View>

              <Text style={styles.brandName}>SafeFind</Text>

              <Text style={styles.headerLabel}>My Reports</Text>

            </View>

          </View>



          <Pressable

            style={styles.backIconButton}

            onPress={() => router.back()}

          >

            <Text style={styles.backIcon}>‹</Text>

          </Pressable>

        </View>



        <View style={[styles.content, { width: contentWidth }]}>

          <View style={styles.introCard}>

            <View style={styles.introIcon}>

              <Text style={styles.introIconText}>✓</Text>

            </View>



            <View style={styles.introTextContainer}>

              <Text style={styles.title}>My Reports</Text>

              <Text style={styles.subtitle}>

                Track the missing-person cases submitted by you.

              </Text>

            </View>

          </View>



          <View style={styles.sectionHeader}>

            <View>

              <Text style={styles.sectionTitle}>Submitted Cases</Text>

              <Text style={styles.sectionSubtitle}>

                {reports.length} {reports.length === 1 ? "report" : "reports"}

              </Text>

            </View>



            {!loading && reports.length > 0 && (

              <Pressable

                style={styles.refreshButton}

                onPress={loadReports}

              >

                <Text style={styles.refreshText}>Refresh</Text>

              </Pressable>

            )}

          </View>



          {loading && (

            <View style={styles.stateCard}>

              <ActivityIndicator size="small" color="#2563EB" />

              <Text style={styles.stateTitle}>Loading your reports...</Text>

              <Text style={styles.stateText}>

                Please wait while SafeFind fetches your submitted cases.

              </Text>

            </View>

          )}



          {!loading && reports.length === 0 && (

            <View style={styles.stateCard}>

              <View style={styles.emptyIcon}>

                <Text style={styles.emptyIconText}>+</Text>

              </View>



              <Text style={styles.stateTitle}>

                No reports submitted yet

              </Text>



              <Text style={styles.stateText}>

                Your missing-person reports will appear here after you submit

                them.

              </Text>

            </View>

          )}



          {!loading &&

            reports.map((report) => {

              const statusStyle = getStatusStyle(report.status);

              const verificationStyle = getVerificationStyle(

                report.verificationStatus

              );



              return (

                <View style={styles.reportCard} key={report._id}>

                  <View style={styles.cardTopRow}>

                    <View style={styles.caseLabel}>

                      <Text style={styles.caseLabelText}>CASE REPORT</Text>

                    </View>



                    <Text style={styles.caseId}>

                      #{String(report._id).slice(-6).toUpperCase()}

                    </Text>

                  </View>



                  <View style={styles.personRow}>
  {report.photoUrl ? (
    <Pressable
      style={styles.photoButton}
      onPress={() => setSelectedPhoto(report.photoUrl)}
    >
      <Image
        source={{ uri: report.photoUrl }}
        style={styles.personPhoto}
        resizeMode="cover"
      />
      <View style={styles.photoHintBadge}>
        <Text style={styles.photoHintText}>View</Text>
      </View>
    </Pressable>
  ) : (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>
        {(report.fullName || "?").trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  )}

  <View style={styles.personTextWrap}>
    <Text style={styles.name}>{report.fullName}</Text>
    <Text style={styles.photoStatusText}>
      {report.photoUrl ? "Tap photo to view" : "No photo uploaded"}
    </Text>
  </View>
</View>



                  <View style={styles.infoGrid}>

                    <View style={styles.infoTile}>

                      <Text style={styles.infoLabel}>AGE</Text>

                      <Text style={styles.infoValue}>

                        {report.age || "—"}

                      </Text>

                    </View>



                    <View style={styles.infoTile}>

                      <Text style={styles.infoLabel}>GENDER</Text>

                      <Text style={styles.infoValue}>

                        {report.gender || "—"}

                      </Text>

                    </View>



                    <View style={[styles.infoTile, styles.locationTile]}>

                      <Text style={styles.infoLabel}>LAST SEEN AREA</Text>

                      <Text

                        style={styles.locationValue}

                        numberOfLines={2}

                      >

                        {report.lastSeenArea || "Not provided"}

                      </Text>

                    </View>

                  </View>



                  <View style={styles.dateRow}>

                    <Text style={styles.dateLabel}>Last seen date</Text>

                    <Text style={styles.dateValue}>

                      {report.lastSeenDate || "Not provided"}

                    </Text>

                  </View>



                  {!!report.description && (

                    <View style={styles.descriptionBox}>

                      <Text style={styles.descriptionLabel}>

                        DESCRIPTION

                      </Text>

                      <Text style={styles.descriptionText}>

                        {report.description}

                      </Text>

                    </View>

                  )}



                  <View style={styles.divider} />



                  <View style={styles.badgesRow}>

                    <View

                      style={[

                        styles.badge,

                        {

                          backgroundColor: statusStyle.backgroundColor,

                        },

                      ]}

                    >

                      <Text

                        style={[

                          styles.badgeText,

                          { color: statusStyle.textColor },

                        ]}

                      >

                        Status: {report.status || "pending"}

                      </Text>

                    </View>



                    <View

                      style={[

                        styles.badge,

                        {

                          backgroundColor: verificationStyle.backgroundColor,

                        },

                      ]}

                    >

                      <Text

                        style={[

                          styles.badgeText,

                          { color: verificationStyle.textColor },

                        ]}

                      >

                        Verification:{" "}

                        {report.verificationStatus || "pending"}

                      </Text>

                    </View>

                  </View>

                </View>

              );

            })}



          <Pressable

            style={styles.dashboardButton}

            onPress={() => router.back()}

          >

            <Text style={styles.dashboardButtonText}>

              Back to Dashboard

            </Text>

          </Pressable>

        </View>

      </ScrollView>

      <Modal
  visible={!!selectedPhoto}
  transparent
  animationType="fade"
  onRequestClose={() => setSelectedPhoto(null)}
>
  <View style={styles.photoModalOverlay}>
    <Pressable
      style={styles.photoModalBackdrop}
      onPress={() => setSelectedPhoto(null)}
    />

    <View style={styles.photoModalContent}>
      <Pressable
        style={styles.photoModalClose}
        onPress={() => setSelectedPhoto(null)}
        hitSlop={10}
      >
        <Text style={styles.photoModalCloseText}>×</Text>
      </Pressable>

      {selectedPhoto ? (
        <Image
          source={{ uri: selectedPhoto }}
          style={styles.photoModalImage}
          resizeMode="contain"
        />
      ) : null}

      <Text style={styles.photoModalHint}>Tap × to close</Text>
    </View>
  </View>
</Modal>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor: "#F8FAFC",

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



  brandName: {

    color: "#FFFFFF",

    fontSize: 21,

    fontWeight: "900",

  },



  headerLabel: {

    color: "#DBEAFE",

    fontSize: 12,

    fontWeight: "700",

    marginTop: 2,

  },



  backIconButton: {

    width: 42,

    height: 42,

    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.16)",

    alignItems: "center",

    justifyContent: "center",

  },



  backIcon: {

    color: "#FFFFFF",

    fontSize: 30,

    fontWeight: "300",

    lineHeight: 32,

  },



  content: {

    alignSelf: "center",

    paddingTop: 20,

  },



  introCard: {

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



  introIcon: {

    width: 48,

    height: 48,

    borderRadius: 16,

    backgroundColor: "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 14,

  },



  introIconText: {

    color: "#2563EB",

    fontSize: 22,

    fontWeight: "900",

  },



  introTextContainer: {

    flex: 1,

  },



  title: {

    color: "#0F172A",

    fontSize: 26,

    fontWeight: "900",

  },



  subtitle: {

    color: "#64748B",

    fontSize: 14,

    lineHeight: 20,

    marginTop: 5,

  },



  sectionHeader: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 26,

    marginBottom: 12,

  },



  sectionTitle: {

    color: "#0F172A",

    fontSize: 19,

    fontWeight: "900",

  },



  sectionSubtitle: {

    color: "#64748B",

    fontSize: 13,

    marginTop: 3,

  },



  refreshButton: {

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 10,

    backgroundColor: "#EFF6FF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

  },



  refreshText: {

    color: "#2563EB",

    fontSize: 13,

    fontWeight: "800",

  },



  reportCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    padding: 18,

    marginBottom: 15,

    shadowColor: "#0F172A",

    shadowOpacity: 0.06,

    shadowRadius: 12,

    shadowOffset: {

      width: 0,

      height: 5,

    },

    elevation: 3,

  },



  cardTopRow: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },



  caseLabel: {

    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: "#EFF6FF",

  },



  caseLabelText: {

    color: "#2563EB",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 0.7,

  },



  caseId: {

    color: "#94A3B8",

    fontSize: 11,

    fontWeight: "700",

  },



  name: {

    color: "#0F172A",

    fontSize: 22,

    fontWeight: "900",

    marginTop: 14,

    marginBottom: 15,

  },



  infoGrid: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

  },



  infoTile: {

    minWidth: "31%",

    flexGrow: 1,

    backgroundColor: "#F8FAFC",

    borderRadius: 12,

    padding: 11,

    borderWidth: 1,

    borderColor: "#E2E8F0",

  },



  locationTile: {

    width: "100%",

  },



  infoLabel: {

    color: "#94A3B8",

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 0.6,

  },



  infoValue: {

    color: "#334155",

    fontSize: 14,

    fontWeight: "800",

    marginTop: 5,

  },



  locationValue: {

    color: "#334155",

    fontSize: 14,

    fontWeight: "800",

    marginTop: 5,

    lineHeight: 19,

  },



  dateRow: {

    backgroundColor: "#EFF6FF",

    borderRadius: 12,

    paddingHorizontal: 12,

    paddingVertical: 11,

    marginTop: 10,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,

  },



  dateLabel: {

    color: "#64748B",

    fontSize: 12,

    fontWeight: "700",

  },



  dateValue: {

    color: "#2563EB",

    fontSize: 12,

    fontWeight: "800",

  },



  descriptionBox: {

    marginTop: 12,

    backgroundColor: "#F8FAFC",

    borderRadius: 12,

    padding: 12,

    borderLeftWidth: 3,

    borderLeftColor: "#2563EB",

  },



  descriptionLabel: {

    color: "#94A3B8",

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 0.6,

  },



  descriptionText: {

    color: "#475569",

    fontSize: 13,

    lineHeight: 19,

    marginTop: 5,

  },



  divider: {

    height: 1,

    backgroundColor: "#E2E8F0",

    marginVertical: 15,

  },



  badgesRow: {

    gap: 8,

  },



  badge: {

    alignSelf: "flex-start",

    borderRadius: 10,

    paddingHorizontal: 11,

    paddingVertical: 8,

  },



  badgeText: {

    fontSize: 12,

    fontWeight: "800",

  },



  personRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 14,
  marginBottom: 15,
},

photoButton: {
  width: 88,
  height: 108,
  borderRadius: 14,
  overflow: "hidden",
  backgroundColor: "#EFF6FF",
  borderWidth: 1,
  borderColor: "#D9E6F7",
  position: "relative",
},

personPhoto: {
  width: "100%",
  height: "100%",
},

photoHintBadge: {
  position: "absolute",
  left: 6,
  bottom: 6,
  backgroundColor: "rgba(15,23,42,0.72)",
  borderRadius: 7,
  paddingHorizontal: 7,
  paddingVertical: 4,
},

photoHintText: {
  color: "#FFFFFF",
  fontSize: 9,
  fontWeight: "800",
},

avatarFallback: {
  width: 88,
  height: 108,
  borderRadius: 14,
  backgroundColor: "#DBEAFE",
  borderWidth: 1,
  borderColor: "#D9E6F7",
  alignItems: "center",
  justifyContent: "center",
},

avatarFallbackText: {
  color: "#2563EB",
  fontSize: 32,
  fontWeight: "900",
},

personTextWrap: {
  flex: 1,
  marginLeft: 13,
},

photoStatusText: {
  color: "#64748B",
  fontSize: 11,
  lineHeight: 16,
  marginTop: 5,
  fontWeight: "600",
},

photoModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(15, 23, 42, 0.88)",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 18,
},

photoModalBackdrop: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
},

photoModalContent: {
  width: "100%",
  maxWidth: 520,
  minHeight: 460,
  borderRadius: 20,
  backgroundColor: "#0F172A",
  padding: 12,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
},

photoModalImage: {
  width: "100%",
  height: 420,
  borderRadius: 14,
},

photoModalClose: {
  position: "absolute",
  top: 10,
  right: 10,
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(255,255,255,0.16)",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
},

photoModalCloseText: {
  color: "#FFFFFF",
  fontSize: 28,
  lineHeight: 30,
  fontWeight: "300",
},

photoModalHint: {
  color: "#CBD5E1",
  fontSize: 11,
  fontWeight: "700",
  marginTop: 8,
},

stateCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    padding: 28,

    alignItems: "center",

    justifyContent: "center",

    minHeight: 180,

  },



  stateTitle: {

    color: "#0F172A",

    fontSize: 17,

    fontWeight: "900",

    textAlign: "center",

    marginTop: 12,

  },



  stateText: {

    color: "#64748B",

    fontSize: 13,

    lineHeight: 19,

    textAlign: "center",

    marginTop: 6,

    maxWidth: 330,

  },



  emptyIcon: {

    width: 52,

    height: 52,

    borderRadius: 17,

    backgroundColor: "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",

  },



  emptyIconText: {

    color: "#2563EB",

    fontSize: 28,

    fontWeight: "700",

  },



  dashboardButton: {

    height: 52,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 10,

  },



  dashboardButtonText: {

    color: "#334155",

    fontSize: 15,

    fontWeight: "800",

  },

});
