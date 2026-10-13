import { useState } from "react";

import {
  ActivityIndicator,

  Alert,

  Image,

  Modal,

  Pressable,

  SafeAreaView,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  useWindowDimensions,

  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { WebView, WebViewMessageEvent } from "react-native-webview";

import * as ImagePicker from "expo-image-picker";

import * as Location from "expo-location";

import { router } from "expo-router";

import { getAuthToken } from "../utils/authStorage";

import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";

const API_URL = "http://10.141.43.231:5000";

export default function ReportMissingScreen() {

  const { width } = useWindowDimensions();

  const [fullName, setFullName] = useState("");

  const [age, setAge] = useState("");

  const [gender, setGender] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);

  const [lastSeenArea, setLastSeenArea] = useState("");

  const [lastSeenDate, setLastSeenDate] = useState("");

  const [description, setDescription] = useState("");

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [photoName, setPhotoName] = useState<string | undefined>();

  const [photoType, setPhotoType] = useState<string | undefined>();

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showMapModal, setShowMapModal] = useState(false);

  const [mapLoading, setMapLoading] = useState(false);

  const [mapCenter, setMapCenter] = useState({

    latitude: 19.076,

    longitude: 72.8777,

  });

  const [mapMarker, setMapMarker] = useState<{

    latitude: number;

    longitude: number;

  } | null>(null);

  const contentWidth = Math.min(width - 32, 640);

  const formatDate = (date: Date) => {

    const day = String(date.getDate()).padStart(2, "0");

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;

  };

  const reverseGeocode = async (

    latitude: number,

    longitude: number

  ) => {

    const addresses = await Location.reverseGeocodeAsync({

      latitude,

      longitude,

    });

    if (!addresses.length) {

      return `Location selected (${latitude.toFixed(

        6

      )}, ${longitude.toFixed(6)})`;

    }

    const address = addresses[0];

    const parts = [

      address.name,

      address.street,

      address.district,

      address.city,

      address.region,

      address.postalCode,

      address.country,

    ]

      .filter(Boolean)

      .filter(

        (value, index, array) =>

          array.indexOf(value) === index

      );

    return (

      parts.join(", ") ||

      `Location selected (${latitude.toFixed(

        6

      )}, ${longitude.toFixed(6)})`

    );

  };

  const chooseCurrentLocation = async () => {

    try {

      setMapLoading(true);

      const { status } =

        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {

        Alert.alert(

          "Location permission required",

          "Please allow location access to choose the last seen area."

        );

        return;

      }

      const currentLocation =

        await Location.getCurrentPositionAsync({

          accuracy: Location.Accuracy.Balanced,

        });

      const latitude = currentLocation.coords.latitude;

      const longitude = currentLocation.coords.longitude;

      const address = await reverseGeocode(

        latitude,

        longitude

      );

      setLastSeenArea(address);

      setMapMarker({ latitude, longitude });

      setMapCenter({

        latitude,

        longitude,

      });

    } catch (error) {

      console.error("Current location error:", error);

      Alert.alert(

        "Location error",

        "Could not determine the current location. Please mark the location on the map."

      );

    } finally {

      setMapLoading(false);

    }

  };

  const openMapPicker = () => {

    if (mapMarker) {

      setMapCenter({

        latitude: mapMarker.latitude,

        longitude: mapMarker.longitude,

      });

    }

    setShowMapModal(true);

  };

  const handleWebMapMessage = (

    event: WebViewMessageEvent

  ) => {

    try {

      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "mapPress") {

        const latitude = Number(data.latitude);

        const longitude = Number(data.longitude);

        if (

          Number.isFinite(latitude) &&

          Number.isFinite(longitude)

        ) {

          setMapMarker({

            latitude,

            longitude,

          });

        }

      }

    } catch (error) {

      console.error("Map message error:", error);

    }

  };

  const getMapHtml = () => {

    const markerLatitude = mapMarker?.latitude ?? "";

    const markerLongitude = mapMarker?.longitude ?? "";

    return `

<!DOCTYPE html>

<html>

<head>

  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

  <link

    rel="stylesheet"

    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"

  />

  <style>

    html, body, #map {

      width: 100%;

      height: 100%;

      margin: 0;

      padding: 0;

      background: #e2e8f0;

    }

    .leaflet-control-attribution {

      font-size: 9px;

    }

  </style>

</head>

<body>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>

    const initialLat = ${mapCenter.latitude};

    const initialLng = ${mapCenter.longitude};

    const map = L.map("map", {

      zoomControl: true,

      attributionControl: true,

    }).setView([initialLat, initialLng], 14);

    L.tileLayer(

      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

      {

        maxZoom: 19,

        attribution: "&copy; OpenStreetMap contributors",

      }

    ).addTo(map);

    let marker = null;

    const existingLat = "${markerLatitude}";

    const existingLng = "${markerLongitude}";

    if (existingLat && existingLng) {

      marker = L.marker([

        Number(existingLat),

        Number(existingLng),

      ]).addTo(map);

      map.setView(

        [Number(existingLat), Number(existingLng)],

        16

      );

    }

    map.on("click", function(event) {

      const latitude = event.latlng.lat;

      const longitude = event.latlng.lng;

      if (marker) {

        marker.setLatLng([latitude, longitude]);

      } else {

        marker = L.marker([latitude, longitude]).addTo(map);

      }

      marker.bindPopup("Selected last seen area").openPopup();

      window\\.ReactNativeWebView\\.postMessage(

        JSON.stringify({

          type: "mapPress",

          latitude,

          longitude

        })

      );

    });

  </script>

</body>

</html>

`;

  };

  const confirmMapLocation = async () => {

    if (!mapMarker) {

      Alert.alert(

        "Select a location",

        "Tap anywhere on the map to mark the last seen area."

      );

      return;

    }

    try {

      setMapLoading(true);

      const address = await reverseGeocode(

        mapMarker.latitude,

        mapMarker.longitude

      );

      setLastSeenArea(address);

      setMapCenter({

        latitude: mapMarker.latitude,

        longitude: mapMarker.longitude,

      });

      setShowMapModal(false);

    } catch (error) {

      console.error("Map location error:", error);

      Alert.alert(

        "Location error",

        "The location was selected, but the address could not be determined."

      );

    } finally {

      setMapLoading(false);

    }

  };

  const handleDateChange = (

    event: any,

    date?: Date

  ) => {

    if (event.type === "dismissed") {

      setShowDatePicker(false);

      return;

    }

    if (date) {

      setSelectedDate(date);

      setLastSeenDate(formatDate(date));

    }

    setShowDatePicker(false);

  };

  const takePhoto = async () => {

    try {

      const permission =

        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {

        Alert.alert(

          "Permission required",

          "Camera permission is required to take a photo."

        );

        return;

      }

      const result = await ImagePicker.launchCameraAsync({

        mediaTypes: ["images"],

        allowsEditing: true,

        quality: 0.8,

        base64: true,

      });

      if (result.canceled || !result.assets?.length) {

        return;

      }

      const asset = result.assets[0];

      setPhotoUri(asset.uri);

      setPhotoName(

        asset.fileName || "safefind-missing-person.jpg"

      );

      setPhotoType(asset.mimeType || "image/jpeg");

      setPhotoBase64(asset.base64 || null);

    } catch (error) {

      console.error("Take photo error:", error);

      Alert.alert("Photo error", "Could not take the photo.");

    }

  };

  const pickFromGallery = async () => {

    try {

      const permission =

        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {

        Alert.alert(

          "Permission required",

          "Gallery permission is required to select a photo."

        );

        return;

      }

      const result =

        await ImagePicker.launchImageLibraryAsync({

          mediaTypes: ["images"],

          allowsEditing: true,

          quality: 0.8,

          base64: true,

        });

      if (result.canceled || !result.assets?.length) {

        return;

      }

      const asset = result.assets[0];

      setPhotoUri(asset.uri);

      setPhotoName(

        asset.fileName || "safefind-missing-person.jpg"

      );

      setPhotoType(asset.mimeType || "image/jpeg");

      setPhotoBase64(asset.base64 || null);

    } catch (error) {

      console.error("Gallery photo error:", error);

      Alert.alert("Photo error", "Could not select the photo.");

    }

  };

  const removePhoto = () => {

    setPhotoUri(null);

    setPhotoName(undefined);

    setPhotoType(undefined);

    setPhotoBase64(null);

  };

  const handleSubmit = async () => {

    if (fullName.trim() === "") {

      alert("Please enter the missing person's name");

      return;

    }

    if (age.trim() === "") {

      alert("Please enter the age");

      return;

    }

    const numericAge = Number(age);

    if (!Number.isInteger(numericAge) || numericAge <= 0) {

      alert("Please enter a valid age");

      return;

    }

    if (lastSeenArea.trim() === "") {

      alert("Please choose or enter the last seen area");

      return;

    }

    if (lastSeenDate.trim() === "") {

      alert("Please select the last seen date");

      return;

    }

    try {

      setSubmitting(true);

      const token = await getAuthToken();

      if (!token) {

        alert("Please login first");

        router.replace("/login");

        return;

      }

      let photoUrl: string | null = null;

      if (photoUri) {

        if (!photoBase64) {

          throw new Error("Photo data is not available.");

        }

        photoUrl = await uploadImageToCloudinary({

          base64: photoBase64,

          mimeType: photoType,

        });

      }

      // Get coordinates for the missing person's last seen area.
      // If the user selected a map marker, use those coordinates.
      // Otherwise, convert the typed address into coordinates.
      let reportLatitude = mapMarker?.latitude ?? null;
      let reportLongitude = mapMarker?.longitude ?? null;

      if (
        reportLatitude === null ||
        reportLongitude === null
      ) {
        try {
          const geocodedLocations =
            await Location.geocodeAsync(lastSeenArea.trim());

          if (geocodedLocations.length > 0) {
            reportLatitude =
              geocodedLocations[0].latitude;
            reportLongitude =
              geocodedLocations[0].longitude;

            console.log(
              "Geocoded missing person location:",
              reportLatitude,
              reportLongitude
            );
          } else {
            Alert.alert(
              "Location not found",
              "Could not find coordinates for this location. Please select the location on the map."
            );
            return;
          }
        } catch (geocodeError) {
          console.error(
            "Missing person geocoding error:",
            geocodeError
          );

          Alert.alert(
            "Location error",
            "Could not determine the location coordinates. Please select the location on the map."
          );
          return;
        }
      }

      const response = await fetch(

        `${API_URL}/api/missing-persons`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({
            fullName: fullName.trim(),
            age: numericAge,
            gender: gender.trim(),
            lastSeenArea: lastSeenArea.trim(),
            latitude: reportLatitude,
            longitude: reportLongitude,
            lastSeenDate: lastSeenDate.trim(),
            description: description.trim(),
            photoUrl: photoUrl,
          }),

        }

      );

      const data = await response.json();

      if (!response.ok) {

        alert(

          data.message || "Could not submit the report"

        );

        return;

      }

      alert("Report submitted for verification.");

      setFullName("");

      setAge("");

      setGender("");

      setLastSeenArea("");

      setLastSeenDate("");

      setDescription("");

      setMapMarker(null);

      removePhoto();

      router.replace("/userdashboard");

    } catch (error) {

      alert("Could not connect to SafeFind server");

    } finally {

      setSubmitting(false);

    }

  };

  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}

        keyboardShouldPersistTaps="handled"

      >

        <View

          style={[

            styles.header,

            {

              paddingHorizontal: Math.max(

                18,

                (width - contentWidth) / 2

              ),

            },

          ]}

        >

          <Pressable

            style={styles.backIconButton}

            onPress={() => router.back()}

          >

            <Text style={styles.backIcon}>‹</Text>

          </Pressable>

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

              <Text style={styles.headerLabel}>

                Report a Case

              </Text>

            </View>

          </View>

        </View>

        <View

          style={[

            styles.content,

            { width: contentWidth },

          ]}

        >

          <View style={styles.introCard}>

            <View style={styles.introIcon}>

              <Text style={styles.introIconText}>+</Text>

            </View>

            <View style={styles.introTextContainer}>

              <Text style={styles.title}>

                Report Missing Person

              </Text>

              <Text style={styles.subtitle}>

                Provide accurate details so the case can be

                reviewed quickly.

              </Text>

            </View>

          </View>

          <View style={styles.noticeCard}>

            <View style={styles.noticeDot} />

            <View style={styles.noticeTextContainer}>

              <Text style={styles.noticeTitle}>

                Before you submit

              </Text>

              <Text style={styles.noticeText}>

                Please check the details carefully. Your report

                will be sent for verification before it becomes

                a verified case.

              </Text>

            </View>

          </View>

          <View style={styles.formCard}>

            <View style={styles.sectionHeader}>

              <Text style={styles.sectionTitle}>

                Basic Details

              </Text>

              <Text style={styles.requiredText}>

                Required fields *

              </Text>

            </View>

            <Text style={styles.label}>

              Full Name *

            </Text>

            <TextInput

              style={styles.input}

              placeholder="Enter full name"

              placeholderTextColor="#94A3B8"

              value={fullName}

              onChangeText={setFullName}

              autoCapitalize="words"

            />

            <View style={styles.row}>

              <View style={styles.halfField}>

                <Text style={styles.label}>

                  Age *

                </Text>

                <TextInput

                  style={styles.input}

                  placeholder="Age"

                  placeholderTextColor="#94A3B8"

                  keyboardType="number-pad"

                  value={age}

                  onChangeText={(text) =>

                    setAge(text.replace(/[^0-9]/g, ""))

                  }

                  maxLength={3}

                />

              </View>

              <View style={styles.halfField}>

                <Text style={styles.label}>

                  Gender

                </Text>

                <Pressable

                  style={styles.dropdownButton}

                  onPress={() => setGenderOpen(!genderOpen)}

                  disabled={submitting}

                >

                  <Text

                    style={[

                      styles.dropdownButtonText,

                      !gender && styles.dropdownPlaceholder,

                    ]}

                  >

                    {gender || "Select gender"}

                  </Text>

                  <Text style={styles.dropdownArrow}>

                    {genderOpen ? "▲" : "▼"}

                  </Text>

                </Pressable>

                {genderOpen && (

                  <View style={styles.dropdownList}>

                    {["Male", "Female", "Other"].map((option) => (

                      <Pressable

                        key={option}

                        style={[

                          styles.dropdownItem,

                          gender === option &&

                            styles.dropdownItemSelected,

                        ]}

                        onPress={() => {

                          setGender(option);

                          setGenderOpen(false);

                        }}

                      >

                        <Text

                          style={[

                            styles.dropdownItemText,

                            gender === option &&

                              styles.dropdownItemTextSelected,

                          ]}

                        >

                          {option}

                        </Text>

                        {gender === option && (

                          <Text style={styles.dropdownCheck}>

                            ✓

                          </Text>

                        )}

                      </Pressable>

                    ))}

                  </View>

                )}

              </View>

            </View>

                        <View style={styles.photoSection}>

              <View style={styles.photoHeaderRow}>

                <View style={styles.photoHeaderTextBox}>

                  <Text style={styles.label}>

                    Missing Person Photo

                  </Text>

                  <Text style={styles.photoHint}>

                    Add a clear photo to help identify the person.

                  </Text>

                </View>

                <View style={styles.photoOptionalBadge}>

                  <Text style={styles.photoOptionalText}>

                    OPTIONAL

                  </Text>

                </View>

              </View>

              {photoUri ? (

                <View style={styles.photoPreviewCard}>

                  <Image

                    source={{ uri: photoUri }}

                    style={styles.photoPreview}

                    resizeMode="cover"

                  />

                  <View style={styles.photoPreviewFooter}>

                    <Text

                      style={styles.photoFileName}

                      numberOfLines={1}

                    >

                      {photoName || "Photo selected"}

                    </Text>

                    <Pressable

                      style={styles.removePhotoButton}

                      onPress={removePhoto}

                      disabled={submitting}

                    >

                      <Text style={styles.removePhotoText}>

                        Remove

                      </Text>

                    </Pressable>

                  </View>

                </View>

              ) : (

                <View style={styles.photoPlaceholder}>

                  <Text style={styles.photoPlaceholderIcon}>📷</Text>

                  <Text style={styles.photoPlaceholderTitle}>

                    No photo selected

                  </Text>

                  <Text style={styles.photoPlaceholderText}>

                    Take a new photo or choose one from your gallery.

                  </Text>

                </View>

              )}

              <View style={styles.photoButtonRow}>

                <Pressable

                  style={styles.photoButton}

                  onPress={takePhoto}

                  disabled={submitting}

                >

                  <Text style={styles.photoButtonIcon}>

                    Camera

                  </Text>

                  <Text style={styles.photoButtonText}>

                    Take Photo

                  </Text>

                </Pressable>

                <Pressable

                  style={styles.photoButton}

                  onPress={pickFromGallery}

                  disabled={submitting}

                >

                  <Text style={styles.photoButtonIcon}>

                    Gallery

                  </Text>

                  <Text style={styles.photoButtonText}>

                    Choose Photo

                  </Text>

                </Pressable>

              </View>

              <Text style={styles.photoUploadNote}>

                The selected image will be uploaded to Cloudinary when

                you submit the report.

              </Text>

            </View>

<Text style={styles.label}>

              Last Seen Area *

            </Text>

            <TextInput

              style={styles.input}

              placeholder="Enter the last seen area"

              placeholderTextColor="#94A3B8"

              value={lastSeenArea}

              onChangeText={setLastSeenArea}

            />

            <View style={styles.mapOptionRow}>

              <Pressable

                style={[

                  styles.mapOptionButton,

                  mapLoading && styles.disabledButton,

                ]}

                onPress={chooseCurrentLocation}

                disabled={mapLoading || submitting}

              >

                {mapLoading ? (

                  <ActivityIndicator

                    size="small"

                    color="#2563EB"

                  />

                ) : (

                  <Text style={styles.mapOptionIcon}>

                    ⌖

                  </Text>

                )}

                <View style={styles.mapOptionTextBox}>

                  <Text style={styles.mapOptionTitle}>

                    Use Current Location

                  </Text>

                  <Text style={styles.mapOptionText}>

                    Use the phone's GPS position

                  </Text>

                </View>

              </Pressable>

              <Pressable

                style={styles.mapOptionButton}

                onPress={openMapPicker}

                disabled={submitting}

              >

                <Text style={styles.mapOptionIcon}>

                  ◉

                </Text>

                <View style={styles.mapOptionTextBox}>

                  <Text style={styles.mapOptionTitle}>

                    Mark on Map

                  </Text>

                  <Text style={styles.mapOptionText}>

                    Choose the location manually

                  </Text>

                </View>

              </Pressable>

            </View>

            <Text style={styles.locationHint}>

              Choose either your current location or mark the

              exact last seen area on the map.

            </Text>

            <Text style={styles.label}>

              Last Seen Date *

            </Text>

            <Pressable

              style={styles.dateButton}

              onPress={() => setShowDatePicker(true)}

              disabled={submitting}

            >

              <Text

                style={[

                  styles.dateButtonText,

                  !lastSeenDate &&

                    styles.datePlaceholder,

                ]}

              >

                {lastSeenDate || "Select date"}

              </Text>

              <Text style={styles.calendarIcon}>

                ▣

              </Text>

            </Pressable>

            {showDatePicker && (

              <DateTimePicker

                value={selectedDate}

                mode="date"

                display="calendar"

                maximumDate={new Date()}

                onChange={handleDateChange}

              />

            )}

            <Text style={styles.label}>

              Description

            </Text>

            <TextInput

              style={[

                styles.input,

                styles.descriptionInput,

              ]}

              placeholder="Clothing, appearance, identifying marks or other useful details"

              placeholderTextColor="#94A3B8"

              multiline

              value={description}

              onChangeText={setDescription}

              textAlignVertical="top"

            />

            <Pressable

              style={[

                styles.submitButton,

                submitting &&

                  styles.submitButtonDisabled,

              ]}

              onPress={handleSubmit}

              disabled={submitting}

            >

              <Text style={styles.submitButtonText}>

                {submitting

                  ? "Submitting..."

                  : "Submit Report"}

              </Text>

            </Pressable>

            <Pressable

              style={styles.cancelButton}

              onPress={() => router.back()}

              disabled={submitting}

            >

              <Text style={styles.cancelButtonText}>

                Back

              </Text>

            </Pressable>

          </View>

          <Text style={styles.footerText}>

            SafeFind • Report responsibly and help bring

            people home.

          </Text>

        </View>

      </ScrollView>

      <Modal

        visible={showMapModal}

        animationType="slide"

        presentationStyle="pageSheet"

        onRequestClose={() => setShowMapModal(false)}

      >

        <SafeAreaView style={styles.mapModal}>

          <View style={styles.mapHeader}>

            <View>

              <Text style={styles.mapTitle}>

                Choose Last Seen Area

              </Text>

              <Text style={styles.mapSubtitle}>

                Tap on the map to mark the location.

              </Text>

            </View>

            <Pressable

              style={styles.mapCloseButton}

              onPress={() => setShowMapModal(false)}

            >

              <Text style={styles.mapCloseText}>

                ✕

              </Text>

            </Pressable>

          </View>

          <WebView

            style={styles.map}

            originWhitelist={["*"]}

            source={{ html: getMapHtml() }}

            javaScriptEnabled

            domStorageEnabled

            onMessage={handleWebMapMessage}

            startInLoadingState

            renderLoading={() => (

              <View style={styles.webMapLoading}>

                <ActivityIndicator

                  size="large"

                  color="#2563EB"

                />

                <Text style={styles.webMapLoadingText}>

                  Loading map...

                </Text>

              </View>

            )}

          />

          <View style={styles.mapBottomCard}>

            <Text style={styles.mapBottomTitle}>

              {mapMarker

                ? "Location selected"

                : "No location selected"}

            </Text>

            <Text style={styles.mapBottomText}>

              {mapMarker

                ? "Tap Confirm Location to use this area."

                : "Tap anywhere on the map to place a marker."}

            </Text>

            <Pressable

              style={[

                styles.confirmMapButton,

                !mapMarker &&

                  styles.confirmMapButtonDisabled,

              ]}

              onPress={confirmMapLocation}

              disabled={!mapMarker || mapLoading}

            >

              {mapLoading ? (

                <ActivityIndicator

                  color="#FFFFFF"

                  size="small"

                />

              ) : (

                <Text style={styles.confirmMapText}>

                  Confirm Location

                </Text>

              )}

            </Pressable>

            <Pressable

              style={styles.mapCancelButton}

              onPress={() => setShowMapModal(false)}

            >

              <Text style={styles.mapCancelText}>

                Cancel

              </Text>

            </Pressable>

          </View>

        </SafeAreaView>

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

    paddingVertical: 14,

    borderBottomLeftRadius: 18,

    borderBottomRightRadius: 18,

  },

  headerLeft: {

    flexDirection: "row",

    alignItems: "center",

    marginLeft: 10,

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

    width: 50,

    height: 50,

    borderRadius: 16,

    backgroundColor: "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 14,

  },

  introIconText: {

    color: "#2563EB",

    fontSize: 27,

    fontWeight: "700",

  },

  introTextContainer: {

    flex: 1,

  },

  title: {

    color: "#0F172A",

    fontSize: 23,

    fontWeight: "900",

  },

  subtitle: {

    color: "#64748B",

    fontSize: 13,

    lineHeight: 19,

    marginTop: 5,

  },

  noticeCard: {

    flexDirection: "row",

    backgroundColor: "#EFF6FF",

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 14,

    marginTop: 14,

  },

  noticeDot: {

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: "#2563EB",

    marginTop: 5,

    marginRight: 10,

  },

  noticeTextContainer: {

    flex: 1,

  },

  noticeTitle: {

    color: "#1D4ED8",

    fontSize: 13,

    fontWeight: "900",

  },

  noticeText: {

    color: "#475569",

    fontSize: 12,

    lineHeight: 18,

    marginTop: 3,

  },

  formCard: {

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    padding: 18,

    marginTop: 16,

    shadowColor: "#0F172A",

    shadowOpacity: 0.06,

    shadowRadius: 12,

    shadowOffset: {

      width: 0,

      height: 5,

    },

    elevation: 3,

  },

  sectionHeader: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 18,

  },

  sectionTitle: {

    color: "#0F172A",

    fontSize: 18,

    fontWeight: "900",

  },

  requiredText: {

    color: "#94A3B8",

    fontSize: 11,

    fontWeight: "600",

  },

  label: {

    color: "#334155",

    fontSize: 12,

    fontWeight: "800",

    marginBottom: 7,

  },

  row: {

    flexDirection: "row",

    gap: 10,

  },

  halfField: {

    flex: 1,

  },

  input: {

    height: 52,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    paddingHorizontal: 14,

    backgroundColor: "#FFFFFF",

    marginBottom: 14,

    fontSize: 15,

    color: "#0F172A",

  },

  genderRow: {

    flexDirection: "row",

    gap: 6,

    marginBottom: 14,

  },

  genderOption: {

    flex: 1,

    minHeight: 52,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 6,

  },

  genderOptionSelected: {

    backgroundColor: "#EFF6FF",

    borderColor: "#2563EB",

  },

  genderOptionText: {

    color: "#475569",

    fontSize: 12,

    fontWeight: "700",

  },

  genderOptionTextSelected: {

    color: "#2563EB",

    fontWeight: "900",

  },

  dropdownButton: {

    height: 52,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

  },

  dropdownButtonText: {

    color: "#0F172A",

    fontSize: 15,

    fontWeight: "600",

  },

  dropdownPlaceholder: {

    color: "#94A3B8",

    fontWeight: "400",

  },

  dropdownArrow: {

    color: "#2563EB",

    fontSize: 13,

    fontWeight: "900",

  },

  dropdownList: {

    marginTop: 6,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    overflow: "hidden",

    shadowColor: "#0F172A",

    shadowOpacity: 0.08,

    shadowRadius: 10,

    shadowOffset: {

      width: 0,

      height: 4,

    },

    elevation: 4,

    zIndex: 20,

  },

  dropdownItem: {

    minHeight: 48,

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderBottomWidth: 1,

    borderBottomColor: "#F1F5F9",

  },

  dropdownItemSelected: {

    backgroundColor: "#EFF6FF",

  },

  dropdownItemText: {

    color: "#334155",

    fontSize: 14,

    fontWeight: "600",

  },

  dropdownItemTextSelected: {

    color: "#2563EB",

    fontWeight: "900",

  },

  dropdownCheck: {

    color: "#2563EB",

    fontSize: 16,

    fontWeight: "900",

  },

  photoSection: {

    marginBottom: 16,

  },

  photoHeaderRow: {

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    marginBottom: 8,

  },

  photoHeaderTextBox: {

    flex: 1,

    paddingRight: 10,

  },

  photoHint: {

    color: "#64748B",

    fontSize: 11,

    lineHeight: 16,

    marginTop: -2,

  },

  photoOptionalBadge: {

    backgroundColor: "#F1F5F9",

    borderRadius: 8,

    paddingHorizontal: 8,

    paddingVertical: 5,

  },

  photoOptionalText: {

    color: "#64748B",

    fontSize: 9,

    fontWeight: "900",

  },

  photoPlaceholder: {

    minHeight: 150,

    borderWidth: 1,

    borderStyle: "dashed",

    borderColor: "#CBD5E1",

    borderRadius: 14,

    backgroundColor: "#F8FAFC",

    alignItems: "center",

    justifyContent: "center",

    padding: 20,

  },

  photoPlaceholderIcon: {

    fontSize: 30,

    marginBottom: 7,

  },

  photoPlaceholderTitle: {

    color: "#334155",

    fontSize: 14,

    fontWeight: "800",

  },

  photoPlaceholderText: {

    color: "#64748B",

    fontSize: 11,

    lineHeight: 16,

    textAlign: "center",

    marginTop: 4,

  },

  photoPreviewCard: {

    borderWidth: 1,

    borderColor: "#D9E6F7",

    borderRadius: 14,

    backgroundColor: "#F8FAFC",

    overflow: "hidden",

  },

  photoPreview: {

    width: "100%",

    height: 220,

  },

  photoPreviewFooter: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 12,

    paddingVertical: 10,

    gap: 10,

  },

  photoFileName: {

    flex: 1,

    color: "#334155",

    fontSize: 12,

    fontWeight: "700",

  },

  removePhotoButton: {

    backgroundColor: "#FEE2E2",

    borderRadius: 9,

    paddingHorizontal: 10,

    paddingVertical: 7,

  },

  removePhotoText: {

    color: "#B91C1C",

    fontSize: 11,

    fontWeight: "900",

  },

  photoButtonRow: {

    flexDirection: "row",

    gap: 10,

    marginTop: 10,

  },

  photoButton: {

    flex: 1,

    minHeight: 48,

    borderRadius: 12,

    backgroundColor: "#EFF6FF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 10,

  },

  photoButtonIcon: {

    color: "#2563EB",

    fontSize: 10,

    fontWeight: "900",

    marginBottom: 2,

  },

  photoButtonText: {

    color: "#1D4ED8",

    fontSize: 12,

    fontWeight: "900",

  },

  photoUploadNote: {

    color: "#94A3B8",

    fontSize: 10,

    lineHeight: 15,

    marginTop: 8,

  },

  mapOptionRow: {

    flexDirection: "row",

    gap: 10,

    marginBottom: 2,

  },

  mapOptionButton: {

    flex: 1,

    minHeight: 76,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    backgroundColor: "#EFF6FF",

    paddingHorizontal: 11,

    paddingVertical: 10,

    flexDirection: "row",

    alignItems: "center",

  },

  mapOptionIcon: {

    color: "#2563EB",

    fontSize: 22,

    fontWeight: "900",

    marginRight: 8,

  },

  mapOptionTextBox: {

    flex: 1,

  },

  mapOptionTitle: {

    color: "#1D4ED8",

    fontSize: 12,

    lineHeight: 17,

    fontWeight: "900",

  },

  mapOptionText: {

    color: "#64748B",

    fontSize: 10,

    lineHeight: 14,

    marginTop: 2,

  },

  locationHint: {

    color: "#64748B",

    fontSize: 11,

    lineHeight: 17,

    marginTop: 7,

    marginBottom: 14,

  },

  dateButton: {

    height: 52,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 14,

  },

  dateButtonText: {

    color: "#0F172A",

    fontSize: 15,

    fontWeight: "600",

  },

  datePlaceholder: {

    color: "#94A3B8",

    fontWeight: "400",

  },

  calendarIcon: {

    color: "#2563EB",

    fontSize: 20,

    fontWeight: "800",

  },

  descriptionInput: {

    minHeight: 112,

    paddingTop: 14,

    paddingBottom: 14,

    textAlignVertical: "top",

  },

  submitButton: {

    height: 54,

    borderRadius: 14,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 4,

  },

  submitButtonDisabled: {

    opacity: 0.65,

  },

  submitButtonText: {

    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "900",

  },

  cancelButton: {

    height: 50,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 10,

  },

  cancelButtonText: {

    color: "#475569",

    fontSize: 15,

    fontWeight: "800",

  },

  disabledButton: {

    opacity: 0.6,

  },

  footerText: {

    color: "#94A3B8",

    fontSize: 11,

    lineHeight: 17,

    textAlign: "center",

    marginTop: 18,

  },

  mapModal: {

    flex: 1,

    backgroundColor: "#FFFFFF",

  },

  mapHeader: {

    minHeight: 76,

    paddingHorizontal: 18,

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderBottomWidth: 1,

    borderBottomColor: "#E2E8F0",

  },

  mapTitle: {

    color: "#0F172A",

    fontSize: 19,

    fontWeight: "900",

  },

  mapSubtitle: {

    color: "#64748B",

    fontSize: 12,

    marginTop: 3,

  },

  mapCloseButton: {

    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",

  },

  mapCloseText: {

    color: "#2563EB",

    fontSize: 18,

    fontWeight: "900",

  },

  map: {

    flex: 1,

  },

  webMapLoading: {

    flex: 1,

    backgroundColor: "#F8FAFC",

    alignItems: "center",

    justifyContent: "center",

  },

  webMapLoadingText: {

    color: "#64748B",

    fontSize: 13,

    marginTop: 10,

  },

  mapBottomCard: {

    backgroundColor: "#FFFFFF",

    borderTopLeftRadius: 22,

    borderTopRightRadius: 22,

    paddingHorizontal: 18,

    paddingTop: 17,

    paddingBottom: 20,

    shadowColor: "#0F172A",

    shadowOpacity: 0.1,

    shadowRadius: 12,

    shadowOffset: {

      width: 0,

      height: -4,

    },

    elevation: 8,

  },

  mapBottomTitle: {

    color: "#0F172A",

    fontSize: 17,

    fontWeight: "900",

  },

  mapBottomText: {

    color: "#64748B",

    fontSize: 12,

    lineHeight: 18,

    marginTop: 4,

  },

  confirmMapButton: {

    height: 52,

    borderRadius: 14,

    backgroundColor: "#2563EB",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 14,

  },

  confirmMapButtonDisabled: {

    backgroundColor: "#CBD5E1",

  },

  confirmMapText: {

    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "900",

  },

  mapCancelButton: {

    height: 48,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 9,

  },

  mapCancelText: {

    color: "#475569",

    fontSize: 14,

    fontWeight: "800",

  },

});
