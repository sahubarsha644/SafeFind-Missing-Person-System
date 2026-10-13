import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type MissingPerson = {
  _id: string;
  fullName: string;
  age: number;
  gender?: string;
  lastSeenArea: string;
  lastSeenDate: string;
  description?: string;
  photoUrl?: string;
  status: string;
  verificationStatus: string;
};

const API_URL = "http://10.141.43.231:5000";

export default function FindMissingScreen() {
  const { reportId } = useLocalSearchParams<{
    reportId?: string;
  }>();

  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadReports = async (searchText = "") => {
    try {
      setLoading(true);

      let url: string;

      // If opened from a notification,
      // load ONLY the specific report that was clicked.
      if (reportId) {
        url = `${API_URL}/api/missing-persons/${reportId}`;
      } else if (searchText.trim() === "") {
        url = `${API_URL}/api/missing-persons`;
      } else {
        url = `${API_URL}/api/missing-persons?search=${encodeURIComponent(
          searchText.trim()
        )}`;
      }

      console.log("Loading missing-person URL:", url);

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load missing-person cases."
        );
      }

      // Notification opened a specific report
      if (reportId) {
        setReports(data.report ? [data.report] : []);
      } else {
        // Normal Find Missing screen
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Load missing-person reports error:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [reportId]);

  const handleSearch = () => {
    // Don't allow searching when opened directly
    // from a notification.
    if (reportId) {
      return;
    }

    loadReports(search);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.headerBrand}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.brandTextWrap}>
                <Text style={styles.brandName}>SafeFind</Text>
                <Text style={styles.brandLabel}>CASE SEARCH</Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countValue}>{reports.length}</Text>
              <Text style={styles.countLabel}>Cases</Text>
            </View>
          </View>

          <Text style={styles.title}>
            {reportId
              ? "Missing Person Alert"
              : "Find a Missing Person"}
          </Text>

          <Text style={styles.subtitle}>
            {reportId
              ? "Details of the missing person from the notification you selected."
              : "Search verified missing-person cases and review their latest reported details."}
          </Text>
        </View>

        {/* SEARCH ONLY FOR NORMAL FIND MISSING */}
        {!reportId && (
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Search cases</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchInputWrap}>
                <Text style={styles.searchIcon}>⌕</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name"
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />

                {search.length > 0 ? (
                  <Pressable
                    style={styles.clearButton}
                    onPress={() => {
                      setSearch("");
                      loadReports();
                    }}
                  >
                    <Text style={styles.clearText}>×</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.searchButtonText}>
                    Search
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {reportId
                ? "Selected Missing Person"
                : "Verified Cases"}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {reports.length}{" "}
              {reports.length === 1 ? "case" : "cases"} available
            </Text>
          </View>

          <View style={styles.verifiedPill}>
            <Text style={styles.verifiedPillText}>
              VERIFIED
            </Text>
          </View>
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text style={styles.stateTitle}>
              Loading case...
            </Text>

            <Text style={styles.stateText}>
              Please wait while SafeFind retrieves the
              missing-person details.
            </Text>
          </View>
        ) : reports.length === 0 ? (
          /* EMPTY */
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>⌕</Text>
            </View>

            <Text style={styles.stateTitle}>
              {reportId
                ? "Case not found"
                : "No cases found"}
            </Text>

            <Text style={styles.stateText}>
              {reportId
                ? "This missing-person report may no longer be available."
                : "Try another name or clear the search to view all approved cases."}
            </Text>
          </View>
        ) : (
          /* REPORTS */
          <View style={styles.list}>
            {reports.map((report) => (
              <Pressable
                key={report._id}
                style={({ pressed }) => [
                  styles.caseCard,
                  pressed && styles.caseCardPressed,
                ]}
              >
                <View style={styles.cardAccent} />

                <View style={styles.cardContent}>
                  {/* TOP */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.personIdentity}>
                      <Pressable
                        style={styles.avatarPressable}
                        onPress={() => {
                          if (report.photoUrl) {
                            setSelectedPhoto(report.photoUrl);
                          }
                        }}
                        disabled={!report.photoUrl}
                      >
                        {report.photoUrl ? (
                          <Image
                            source={{
                              uri: report.photoUrl,
                            }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
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
                      </Pressable>

                      <View style={styles.personText}>
                        <Text style={styles.name}>
                          {report.fullName}
                        </Text>

                        <Text style={styles.meta}>
                          Age {report.age} •{" "}
                          {report.gender ||
                            "Gender not specified"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>
                        VERIFIED
                      </Text>
                    </View>
                  </View>

                  {/* LOCATION */}
                  <View style={styles.locationRow}>
                    <View style={styles.infoIcon}>
                      <Text style={styles.infoIconText}>
                        ⌖
                      </Text>
                    </View>

                    <View style={styles.locationContent}>
                      <Text style={styles.infoLabel}>
                        Last seen
                      </Text>

                      <Text
                        style={styles.locationValue}
                        numberOfLines={2}
                      >
                        {report.lastSeenArea}
                      </Text>
                    </View>
                  </View>

                  {/* DATE */}
                  <View style={styles.dateRow}>
                    <View style={styles.dateItem}>
                      <Text style={styles.infoLabel}>
                        Date
                      </Text>

                      <Text style={styles.dateValue}>
                        {report.lastSeenDate}
                      </Text>
                    </View>

                    <View style={styles.openBadge}>
                      <Text style={styles.openText}>
                        Case
                      </Text>

                      <Text style={styles.openArrow}>
                        ›
                      </Text>
                    </View>
                  </View>

                  {/* DESCRIPTION */}
                  {report.description ? (
                    <View style={styles.descriptionBox}>
                      <Text style={styles.infoLabel}>
                        Description
                      </Text>

                      <Text
                        style={styles.descriptionText}
                        numberOfLines={5}
                      >
                        {report.description}
                      </Text>
                    </View>
                  ) : null}

                  {/* REPORT SIGHTING BUTTON */}
                  {reportId && (
                    <Pressable
                      style={styles.sightingButton}
                      onPress={() => {
                        router.push({
                          pathname: "/sighting",
                          params: {
                            reportId: report._id,
                          },
                        });
                      }}
                    >
                      <Text style={styles.sightingButtonText}>
                        Report Sighting
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* BACK BUTTON */}
        <Pressable
          style={styles.dashboardButton}
          onPress={() => router.back()}
        >
          <Text style={styles.dashboardButtonText}>
            Back
          </Text>
        </Pressable>
      </ScrollView>

      {/* PHOTO MODAL */}
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
              <Text style={styles.photoModalCloseText}>
                ×
              </Text>
            </Pressable>

            {selectedPhoto ? (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.photoModalImage}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.photoModalHint}>
              Tap × to close
            </Text>
          </View>
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
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  headerCard: {
    backgroundColor: "#2563EB",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 30,
    lineHeight: 30,
    color: "#FFFFFF",
    marginTop: -3,
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },

  logo: {
    width: 48,
    height: 48,
    marginRight: 8,
  },

  brandTextWrap: {
    flex: 1,
  },

  brandName: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  brandLabel: {
    fontSize: 8,
    color: "#DBEAFE",
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 2,
  },

  countBadge: {
    minWidth: 52,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
  },

  countValue: {
    fontSize: 17,
    color: "#2563EB",
    fontWeight: "900",
    lineHeight: 20,
  },

  countLabel: {
    fontSize: 8,
    color: "#64748B",
    fontWeight: "800",
    marginTop: 1,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    color: "#FFFFFF",
    fontWeight: "900",
    marginTop: 20,
  },

  subtitle: {
    maxWidth: 440,
    fontSize: 12,
    lineHeight: 18,
    color: "#DBEAFE",
    marginTop: 6,
  },

  searchCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  searchLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchInputWrap: {
    flex: 1,
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },

  searchIcon: {
    fontSize: 20,
    color: "#2563EB",
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: "#0F172A",
    fontSize: 13,
  },

  clearButton: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  clearText: {
    color: "#2563EB",
    fontSize: 18,
    lineHeight: 19,
    marginTop: -2,
  },

  searchButton: {
    minWidth: 82,
    height: 50,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 9,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  verifiedPill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  verifiedPillText: {
    color: "#15803D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  list: {
    gap: 12,
  },

  caseCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D9E6F7",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  caseCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
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

  avatarPressable: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
  },

  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
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

  personText: {
    flex: 1,
    marginLeft: 11,
  },

  name: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  meta: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 3,
  },

  statusPill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 8,
    color: "#15803D",
    fontWeight: "900",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 13,
    padding: 10,
    marginTop: 12,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  infoIconText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  locationContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  locationValue: {
    fontSize: 12,
    lineHeight: 17,
    color: "#1E293B",
    fontWeight: "800",
    marginTop: 2,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 11,
  },

  dateItem: {
    flex: 1,
  },

  dateValue: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "800",
    marginTop: 2,
  },

  openBadge: {
    minWidth: 58,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  openText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2563EB",
  },

  openArrow: {
    fontSize: 20,
    lineHeight: 22,
    color: "#2563EB",
    marginLeft: 3,
    marginTop: -1,
  },

  descriptionBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    marginTop: 11,
  },

  descriptionText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#475569",
    marginTop: 3,
  },

  sightingButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  sightingButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
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
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconText: {
    fontSize: 27,
    color: "#2563EB",
    fontWeight: "900",
  },

  stateTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 13,
  },

  stateText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
  },

  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.94)",
    justifyContent: "center",
    alignItems: "center",
  },

  photoModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  photoModalContent: {
    width: "92%",
    height: "82%",
    borderRadius: 20,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    overflow: "hidden",
  },

  photoModalImage: {
    width: "100%",
    height: "100%",
  },

  photoModalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  photoModalCloseText: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: -2,
  },

  photoModalHint: {
    position: "absolute",
    bottom: 10,
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "700",
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