import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const REPORT_ID_KEY = "pendingNotificationReportId";

export async function savePendingReportId(reportId: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(REPORT_ID_KEY, reportId);
    return;
  }

  await SecureStore.setItemAsync(REPORT_ID_KEY, reportId);
}

export async function getPendingReportId() {
  if (Platform.OS === "web") {
    return localStorage.getItem(REPORT_ID_KEY);
  }

  return await SecureStore.getItemAsync(REPORT_ID_KEY);
}

export async function removePendingReportId() {
  if (Platform.OS === "web") {
    localStorage.removeItem(REPORT_ID_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(REPORT_ID_KEY);
}