import { useEffect, useMemo, useState } from "react";

import {

  ActivityIndicator,
  Image,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  View,

} from "react-native";

import { router } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import { getAuthToken } from "../utils/authStorage";

const API_URL = "http\://10.141.43.231:5000";

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

export default function AdminVerifiedReportsScreen() {

  const [reports, setReports] = useState<VerifiedReport[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadVerifiedReports();

  }, []);

  const loadVerifiedReports = async () => {

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

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(

          data.message || "Failed to load verified reports."

        );

      }

      setReports(data.reports || []);

    } catch (error) {

      console.error("Load verified reports error:", error);

    } finally {

      setLoading(false);

    }

  };

  const filteredReports = useMemo(() => {

    const query = search.trim().toLowerCase();

    if (!query) {

      return reports;

    }

    return reports.filter((report) => {

      return (

        report.fullName.toLowerCase().includes(query) ||

        report.lastSeenArea.toLowerCase().includes(query) ||

        report._id.toLowerCase().includes(query) ||

        report._id.slice(-8).toLowerCase().includes(query) ||

        (report.gender || "").toLowerCase().includes(query) ||

        (report.reportedBy?.fullName || "")

          .toLowerCase()

          .includes(query)

      );

    });

  }, [reports, search]);

  return (

    <SafeAreaView style={styles.safeArea}>

      <View style={styles.page}>

        <View style={styles.headerBar}>

          <Pressable

            style={styles.backButton}

            onPress={() => router.replace("/admin")}

          >

            <Text style={styles.backIcon}>‹</Text>

          </Pressable>

          <View style={styles.headerCenter}>

            <Text style={styles.headerTitle}>Verified Reports</Text>

            <Text style={styles.headerSubtitle}>

              {filteredReports.length}{" "}

              {filteredReports.length === 1 ? "case" : "cases"}

            </Text>

          </View>

          <View style={styles.headerBadge}>

            <Text style={styles.headerBadgeText}>

              {reports.length}

            </Text>

          </View>

        </View>

        <View style={styles.content}>

          <View style={styles.searchBox}>

            <Text style={styles.searchIcon}>⌕</Text>

            <TextInput

              value={search}

              onChangeText={setSearch}

              placeholder="Search cases..."

              placeholderTextColor="#94A3B8"

              style={styles.searchInput}

              autoCapitalize="none"

              autoCorrect={false}

            />

            {search.length > 0 ? (

              <Pressable

                style={styles.clearButton}

                onPress={() => setSearch("")}

              >

                <Text style={styles.clearText}>×</Text>

              </Pressable>

            ) : null}

          </View>

          <View style={styles.listHeader}>

            <Text style={styles.listHeaderTitle}>VERIFIED CASES</Text>

            <Text style={styles.listHeaderCount}>

              {filteredReports.length} cases

            </Text>

          </View>

          {loading ? (

            <View style={styles.stateArea}>

              <ActivityIndicator size="large" color="#2563EB" />

              <Text style={styles.stateTitle}>

                Loading cases...

              </Text>

            </View>

          ) : filteredReports.length === 0 ? (

            <View style={styles.stateArea}>

              <Text style={styles.stateIcon}>⌕</Text>

              <Text style={styles.stateTitle}>

                No matching cases

              </Text>

              <Text style={styles.stateText}>

                Try another name, area or case ID.

              </Text>

            </View>

          ) : (

            <ScrollView

              style={styles.list}

              showsVerticalScrollIndicator={false}

              contentContainerStyle={styles.listContent}

            >

              {filteredReports.map((report, index) => (

                <Pressable

                  key={report._id}

                  style={({ pressed }) => [

                    styles.listRow,

                    pressed && styles.pressedRow,

                  ]}

                  onPress={() =>

                    router.push({

                      pathname: "/admin_verified_detail",

                      params: { id: report._id },

                    })

                  }

                >


                  {report.photoUrl ? (
                    <Image
                      source={{ uri: report.photoUrl }}
                      style={styles.listPhoto}
                    />
                  ) : (
                    <View style={styles.listPhotoPlaceholder}>
                      <Text style={styles.listPhotoLetter}>
                        {report.fullName
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.rowMain}>

                    <View style={styles.rowTop}>

                      <View style={styles.rowTitleWrap}>

                        <Text

                          style={styles.rowTitle}

                          numberOfLines={1}

                        >

                          {report.fullName}

                        </Text>

                        <Text style={styles.caseId}>

                          Case ID: {report._id.slice(-8)}

                        </Text>

                      </View>

                      <View style={styles.statusArea}>

                        <Text style={styles.statusText}>

                          Verified

                        </Text>

                        <Text style={styles.dateText}>

                          {report.lastSeenDate}

                        </Text>

                      </View>

                    </View>

                    <Text

                      style={styles.areaText}

                      numberOfLines={1}

                    >

                      {report.lastSeenArea}

                    </Text>

                    <View style={styles.metaRow}>

                      <Text style={styles.metaText}>

                        Age {report.age}

                      </Text>

                      <Text style={styles.metaDot}>•</Text>

                      <Text style={styles.metaText}>

                        {report.gender || "Gender not specified"}

                      </Text>

                      <Text style={styles.metaDot}>•</Text>

                      <Text style={styles.metaText}>

                        {report.description

                          ? report.description

                          : "No description"}

                      </Text>

                    </View>

                  </View>

                  <Text style={styles.arrow}>›</Text>

                </Pressable>

              ))}

            </ScrollView>

          )}

          <Pressable

            style={styles.dashboardButton}

            onPress={() => router.replace("/admin")}

          >

            <Text style={styles.dashboardButtonText}>

              Back to Admin Dashboard

            </Text>

          </Pressable>

        </View>

      </View>

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

  headerBar: {

    minHeight: 72,

    backgroundColor: "#2563EB",

    paddingHorizontal: 15,

    paddingTop: 10,

    paddingBottom: 10,

    flexDirection: "row",

    alignItems: "center",

    borderBottomLeftRadius: 18,

    borderBottomRightRadius: 18,

  },

  backButton: {

    width: 40,

    height: 40,

    borderRadius: 12,

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

    alignItems: "center",

    marginHorizontal: 10,

  },

  headerTitle: {

    fontSize: 18,

    fontWeight: "900",

    color: "#FFFFFF",

  },

  headerSubtitle: {

    fontSize: 10,

    color: "#DBEAFE",

    marginTop: 2,

    fontWeight: "700",

  },

  headerBadge: {

    minWidth: 42,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

  },

  headerBadgeText: {

    fontSize: 18,

    fontWeight: "900",

    color: "#2563EB",

  },

  content: {

    flex: 1,

    paddingHorizontal: 14,

    paddingTop: 16,

    paddingBottom: 16,

  },

  searchBox: {

    height: 46,

    borderRadius: 11,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 11,

    marginBottom: 12,

  },

  searchIcon: {

    fontSize: 20,

    color: "#2563EB",

    marginRight: 7,

  },

  searchInput: {

    flex: 1,

    height: "100%",

    fontSize: 13,

    color: "#0F172A",

  },

  clearButton: {

    width: 26,

    height: 26,

    borderRadius: 13,

    backgroundColor: "#EFF6FF",

    justifyContent: "center",

    alignItems: "center",

  },

  clearText: {

    fontSize: 18,

    lineHeight: 19,

    color: "#2563EB",

    marginTop: -2,

  },

  listHeader: {

    minHeight: 42,

    paddingHorizontal: 4,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

  },

  listHeaderTitle: {

    fontSize: 13,

    fontWeight: "900",

    color: "#0F172A",

    letterSpacing: 0.7,

  },

  listHeaderCount: {

    fontSize: 11,

    color: "#64748B",

    fontWeight: "800",

  },

  list: {

    flex: 1,

    backgroundColor: "transparent",

  },

  listContent: {

    paddingTop: 4,

    paddingBottom: 10,

    gap: 12,

  },

  listRow: {

    minHeight: 122,

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 15,

    shadowColor: "#0F172A",

    shadowOpacity: 0.07,

    shadowRadius: 10,

    shadowOffset: { width: 0, height: 4 },

    elevation: 3,

  },

  pressedRow: {

    opacity: 0.9,

    transform: [{ scale: 0.995 }],

  },

  listPhoto: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    marginRight: 12,
  },

  listPhotoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  listPhotoLetter: {
    color: "#2563EB",
    fontSize: 21,
    fontWeight: "900",
  },

  rowMain: {

    flex: 1,

  },

  rowTop: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-start",

  },

  rowTitleWrap: {

    flex: 1,

    paddingRight: 8,

  },

  rowTitle: {

    fontSize: 17,

    fontWeight: "900",

    color: "#0F172A",

  },

  caseId: {

    fontSize: 10,

    color: "#94A3B8",

    fontWeight: "700",

    marginTop: 3,

  },

  statusArea: {

    alignItems: "flex-end",

    minWidth: 84,

  },

  statusText: {

    fontSize: 11,

    fontWeight: "900",

    color: "#15803D",

  },

  dateText: {

    fontSize: 10.5,

    color: "#475569",

    marginTop: 3,

    fontWeight: "700",

  },

  areaText: {

    fontSize: 13,

    color: "#334155",

    fontWeight: "800",

    marginTop: 9,

  },

  metaRow: {

    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,

    paddingRight: 3,

  },

  metaText: {

    flexShrink: 1,

    fontSize: 10.5,

    lineHeight: 15,

    color: "#64748B",

  },

  metaDot: {

    fontSize: 10,

    color: "#94A3B8",

    marginHorizontal: 5,

  },

  arrow: {

    position: "absolute",

    right: 14,

    bottom: 14,

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: "#EFF6FF",

    textAlign: "center",

    fontSize: 24,

    lineHeight: 30,

    color: "#2563EB",

    fontWeight: "700",

  },

  stateArea: {

    flex: 1,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 30,

  },

  stateIcon: {

    fontSize: 34,

    color: "#2563EB",

  },

  stateTitle: {

    fontSize: 17,

    fontWeight: "900",

    color: "#0F172A",

    marginTop: 10,

  },

  stateText: {

    fontSize: 12,

    lineHeight: 18,

    color: "#64748B",

    textAlign: "center",

    marginTop: 4,

  },

  dashboardButton: {

    minHeight: 48,

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    borderWidth: 1.5,

    borderColor: "#CBD5E1",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 10,

  },

  dashboardButtonText: {

    fontSize: 14,

    color: "#334155",

    fontWeight: "800",

  },

});
