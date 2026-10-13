import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect } from "react";

import { removeAuthToken } from "../utils/authStorage";

export default function RootLayout() {
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          try {
            const data =
              response.notification.request.content.data;

            console.log(
              "NOTIFICATION CLICKED:",
              data
            );

            // ONLY handle SafeFind nearby alerts
            if (
              data?.type !==
              "nearby_missing_person"
            ) {
              return;
            }

            console.log(
              "Removing saved login token..."
            );

            // Delete saved login credentials
            await removeAuthToken();

            console.log(
              "Login token removed"
            );

            // IMPORTANT:
            // Do NOT open /find
            // Do NOT use reportId
            // Do NOT save pending report
            router.replace("/login");
          } catch (error) {
            console.error(
              "Notification click error:",
              error
            );
          }
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    />
  );
}