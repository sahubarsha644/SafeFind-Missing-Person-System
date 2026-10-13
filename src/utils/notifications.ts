import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications() {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("safefind-alerts", {
        name: "SafeFind Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch (error) {
    console.error("Notification setup error:", error);
  }
}

export async function sendSafeFindNotification(
  title: string,
  body: string
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Local notification error:", error);
  }
}

export async function getExpoPushToken() {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    let finalStatus = status;

    if (status !== "granted") {
      const permission = await Notifications.requestPermissionsAsync();
      finalStatus = permission.status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("Expo project ID not found");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo Push Token:", token.data);

    return token.data;
  } catch (error) {
    console.error("Failed to get Expo Push Token:", error);
    return null;
  }
}

export async function saveExpoPushToken(
  token: string,
  authToken: string
) {
  try {
    const response = await fetch(
      "http://10.141.43.231:5000/api/users/push-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          expoPushToken: token,
          notificationsEnabled: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to save push token:", data);
      return false;
    }

    console.log("Push token saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving push token:", error);
    return false;
  }
}