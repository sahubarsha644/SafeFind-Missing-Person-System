import React, { useEffect, useState } from "react";

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

import * as ImagePicker from "expo-image-picker";

import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import { WebView } from "react-native-webview";

import { router } from "expo-router";

import { getAuthToken } from "../utils/authStorage";

import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";



const API_URL = "http://10.141.43.231:5000";



type MissingPerson = {

  _id: string;

  fullName: string;

  age: number;

  gender?: string;

  lastSeenArea: string;

  lastSeenDate: string;

};



export default function SightingScreen() {

  const { width } = useWindowDimensions();



  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);

  const [selectedPersonId, setSelectedPersonId] = useState("");

  const [location, setLocation] = useState("");

  const [date, setDate] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [description, setDescription] = useState("");

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [photoName, setPhotoName] = useState<string | undefined>();

  const [photoType, setPhotoType] = useState<string | undefined>();

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);

  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapSelectedLatitude, setMapSelectedLatitude] = useState<number | null>(null);
  const [mapSelectedLongitude, setMapSelectedLongitude] = useState<number | null>(null);

  const [validationError, setValidationError] = useState("");



  const contentWidth = Math.min(width - 32, 640);

  const formatDate = (value: Date) => {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (_event: any, value?: Date) => {
    if (value) {
      setSelectedDate(value);
      setDate(formatDate(value));
    }

    setDatePickerVisible(false);
    setValidationError("");
  };

  const openMap = () => {
    setMapSelectedLatitude(latitude);
    setMapSelectedLongitude(longitude);
    setMapVisible(true);
  };

  const mapCenterLatitude = latitude ?? 19.076;
  const mapCenterLongitude = longitude ?? 72.8777;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
          body { overflow: hidden; font-family: Arial, sans-serif; }
          .map-note {
            position: absolute;
            top: 12px;
            left: 12px;
            right: 12px;
            z-index: 9999;
            background: rgba(255,255,255,0.95);
            border-radius: 12px;
            padding: 10px 12px;
            font-size: 12px;
            color: #0F172A;
            box-shadow: 0 2px 10px rgba(15,23,42,0.15);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-note">Tap anywhere on the map to select the sighting location.</div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const startLat = ${mapCenterLatitude};
          const startLng = ${mapCenterLongitude};

          const map = L.map("map").setView([startLat, startLng], 15);

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: "&copy; OpenStreetMap contributors"
            }
          ).addTo(map);

          let marker = L.marker([startLat, startLng]).addTo(map);

          function sendPoint(lat, lng) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ latitude: lat, longitude: lng })
            );
          }

          if (${latitude !== null && longitude !== null ? "true" : "false"}) {
            sendPoint(startLat, startLng);
          }

          map.on("click", function(event) {
            const lat = event.latlng.lat;
            const lng = event.latlng.lng;

            marker.setLatLng([lat, lng]);
            sendPoint(lat, lng);
          });
        </script>
      </body>
    </html>
  `;

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        setMapSelectedLatitude(data.latitude);
        setMapSelectedLongitude(data.longitude);
      }
    } catch (error) {
      console.error("Map message error:", error);
    }
  };

  const useSelectedMapLocation = async () => {
    if (mapSelectedLatitude === null || mapSelectedLongitude === null) {
      Alert.alert("Select a location", "Tap a point on the map first.");
      return;
    }

    try {
      setLocationLoading(true);

      setLatitude(mapSelectedLatitude);
      setLongitude(mapSelectedLongitude);

      const addresses = await Location.reverseGeocodeAsync({
        latitude: mapSelectedLatitude,
        longitude: mapSelectedLongitude,
      });

      let formattedAddress = "";

      if (addresses.length > 0) {
        const address = addresses[0];

        formattedAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ]
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .join(", ");
      }

      setLocation(
        formattedAddress ||
          `Selected location (${mapSelectedLatitude.toFixed(6)}, ${mapSelectedLongitude.toFixed(6)})`
      );

      setValidationError("");
      setMapVisible(false);
    } catch (error) {
      console.error("Map location reverse geocode error:", error);

      setLatitude(mapSelectedLatitude);
      setLongitude(mapSelectedLongitude);
      setLocation(
        `Selected location (${mapSelectedLatitude.toFixed(6)}, ${mapSelectedLongitude.toFixed(6)})`
      );
      setValidationError("");
      setMapVisible(false);
    } finally {
      setLocationLoading(false);
    }
  };



  useEffect(() => {

    loadMissingPersons();

  }, []);



  const loadMissingPersons = async () => {

    try {

      const response = await fetch(`${API_URL}/api/missing-persons`);

      const data = await response.json();



      if (!response.ok) {

        Alert.alert(

          "Error",

          data.message || "Failed to load missing persons."

        );

        return;

      }



      setMissingPersons(data.reports || []);

    } catch (error) {

      console.error("Load missing persons error:", error);

      Alert.alert("Error", "Could not connect to SafeFind server.");

    } finally {

      setLoading(false);

    }

  };



  const takePhoto = async () => {

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

    setPhotoName(asset.fileName || "safefind-photo.jpg");

    setPhotoType(asset.mimeType || "image/jpeg");

    setPhotoBase64(asset.base64 || null);

  };



  const pickFromGallery = async () => {

    const permission =

      await ImagePicker.requestMediaLibraryPermissionsAsync();



    if (!permission.granted) {

      Alert.alert(

        "Permission required",

        "Gallery permission is required to select a photo."

      );

      return;

    }



    const result = await ImagePicker.launchImageLibraryAsync({

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

    setPhotoName(asset.fileName || "safefind-photo.jpg");

    setPhotoType(asset.mimeType || "image/jpeg");

    setPhotoBase64(asset.base64 || null);

  };



  const removePhoto = () => {

    setPhotoUri(null);

    setPhotoName(undefined);

    setPhotoType(undefined);

    setPhotoBase64(null);

  };



  const getCurrentLocation = async () => {

    try {

      setLocationLoading(true);

      setValidationError("");



      const { status } =

        await Location.requestForegroundPermissionsAsync();



      if (status !== "granted") {

        const message =

          "Please allow location access to capture the sighting address.";



        setValidationError(message);

        Alert.alert("Location permission required", message);

        return;

      }



      const currentLocation =

        await Location.getCurrentPositionAsync({

          accuracy: Location.Accuracy.Balanced,

        });



      const currentLatitude = currentLocation.coords.latitude;

      const currentLongitude = currentLocation.coords.longitude;



      setLatitude(currentLatitude);

      setLongitude(currentLongitude);



      const addresses = await Location.reverseGeocodeAsync({

        latitude: currentLatitude,

        longitude: currentLongitude,

      });



      if (addresses.length > 0) {

        const address = addresses[0];



        const addressParts = [

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



        const formattedAddress = addressParts.join(", ");



        if (formattedAddress) {

          setLocation(formattedAddress);



          Alert.alert(

            "Location captured",

            `Address:\n${formattedAddress}`

          );

        } else {

          setLocation(

            `Location captured (${currentLatitude.toFixed(

              6

            )}, ${currentLongitude.toFixed(6)})`

          );



          Alert.alert(

            "Location captured",

            "The address could not be determined automatically."

          );

        }

      } else {

        setLocation(

          `Location captured (${currentLatitude.toFixed(

            6

          )}, ${currentLongitude.toFixed(6)})`

        );



        Alert.alert(

          "Location captured",

          "The address could not be determined automatically."

        );

      }

    } catch (error) {

      console.error("Get location error:", error);



      const message =

        "Could not determine the exact address. Please enter the location manually.";



      setValidationError(message);

      Alert.alert("Location error", message);

    } finally {

      setLocationLoading(false);

    }

  };



  const submitSighting = async () => {

    setValidationError("");



    if (!selectedPersonId) {

      const message = "Please select a missing person.";

      setValidationError(message);

      Alert.alert("Missing field", message);

      return;

    }



    if (!location.trim()) {

      const message = "Please enter the sighting location.";

      setValidationError(message);

      Alert.alert("Missing field", message);

      return;

    }



    if (!date.trim()) {

      const message = "Please enter the sighting date.";

      setValidationError(message);

      Alert.alert("Missing field", message);

      return;

    }



    try {

      setSubmitting(true);



      const token = await getAuthToken();



      if (!token) {

        Alert.alert("Error", "Please login first.");

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



      const response = await fetch(`${API_URL}/api/sightings`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          missingPersonId: selectedPersonId,

          location: location.trim(),

          date: date.trim(),

          description: description.trim(),

          photoUrl,

          latitude,

          longitude,

        }),

      });



      const data = await response.json();



      if (!response.ok) {

        Alert.alert(

          "Error",

          data.message || "Failed to submit sighting."

        );

        return;

      }



      Alert.alert(

        "Success",

        "Sighting submitted for review."

      );



      setSelectedPersonId("");

      setLocation("");

      setDate("");

      setDescription("");

      setLatitude(null);

      setLongitude(null);

      removePhoto();



      router.replace("/dashboard");

    } catch (error) {

      console.error("Submit sighting error:", error);

      Alert.alert(

        "Error",

        "Could not upload the photo or connect to the server."

      );

    } finally {

      setSubmitting(false);

    }

  };



  if (loading) {

    return (

      <SafeAreaView style={styles.center}>

        <View style={styles.loadingCard}>

          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.loadingTitle}>

            Loading approved cases

          </Text>

          <Text style={styles.loadingText}>

            Getting verified missing-person cases from SafeFind.

          </Text>

        </View>

      </SafeAreaView>

    );

  }



  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={styles.scrollContent}

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

                Report a Sighting

              </Text>

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

              <Text style={styles.introIconText}>!</Text>

            </View>



            <View style={styles.introTextContainer}>

              <Text style={styles.title}>

                Report a Sighting

              </Text>

              <Text style={styles.subtitle}>

                Share accurate information about a possible sighting.

              </Text>

            </View>

          </View>



          <View style={styles.noticeCard}>

            <View style={styles.noticeIcon}>

              <Text style={styles.noticeIconText}>✓</Text>

            </View>



            <View style={styles.noticeTextContainer}>

              <Text style={styles.noticeTitle}>

                Help us verify the sighting

              </Text>

              <Text style={styles.noticeText}>

                Select the correct case and provide the location,

                date, description and photo evidence when available.

              </Text>

            </View>

          </View>



          <View style={styles.formCard}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>

                  Missing Person

                </Text>

                <Text style={styles.sectionSubtitle}>

                  Select an approved case

                </Text>

              </View>



              <View style={styles.verifiedBadge}>

                <Text style={styles.verifiedText}>

                  VERIFIED

                </Text>

              </View>

            </View>



            {missingPersons.length === 0 ? (

              <View style={styles.emptyBox}>

                <View style={styles.emptyIcon}>

                  <Text style={styles.emptyIconText}>!</Text>

                </View>



                <Text style={styles.emptyTitle}>

                  No approved cases available

                </Text>



                <Text style={styles.emptyText}>

                  There are currently no verified missing-person

                  cases available for a sighting report.

                </Text>

              </View>

            ) : (

              missingPersons.map((person) => {

                const selected =

                  selectedPersonId === person._id;



                return (

                  <Pressable

                    key={person._id}

                    style={[

                      styles.personCard,

                      selected && styles.personCardSelected,

                    ]}

                    onPress={() => {

                      setSelectedPersonId(person._id);

                      setValidationError("");

                    }}

                  >

                    <View style={styles.personCardTop}>

                      <View

                        style={[

                          styles.avatar,

                          selected && styles.avatarSelected,

                        ]}

                      >

                        <Text

                          style={[

                            styles.avatarText,

                            selected && styles.avatarTextSelected,

                          ]}

                        >

                          {person.fullName

                            ?.charAt(0)

                            ?.toUpperCase() || "?"}

                        </Text>

                      </View>



                      <View style={styles.personMain}>

                        <Text

                          style={[

                            styles.personName,

                            selected &&

                              styles.personNameSelected,

                          ]}

                        >

                          {person.fullName}

                        </Text>



                        <Text style={styles.caseLine}>

                          Age {person.age}

                          {person.gender

                            ? `  •  ${person.gender}`

                            : ""}

                        </Text>

                      </View>



                      <View

                        style={[

                          styles.selectCircle,

                          selected && styles.selectCircleSelected,

                        ]}

                      >

                        {selected && (

                          <Text style={styles.selectCheck}>✓</Text>

                        )}

                      </View>

                    </View>



                    <View style={styles.personDetails}>

                      <View style={styles.detailRow}>

                        <Text style={styles.detailLabel}>

                          Last seen

                        </Text>

                        <Text

                          style={styles.detailValue}

                          numberOfLines={2}

                        >

                          {person.lastSeenArea}

                        </Text>

                      </View>



                      <View style={styles.detailRow}>

                        <Text style={styles.detailLabel}>

                          Date

                        </Text>

                        <Text style={styles.detailValue}>

                          {person.lastSeenDate}

                        </Text>

                      </View>

                    </View>

                  </Pressable>

                );

              })

            )}

          </View>



          <View style={styles.formCard}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>

                  Sighting Details

                </Text>

                <Text style={styles.sectionSubtitle}>

                  Tell us where and when you saw the person

                </Text>

              </View>

            </View>



            <Text style={styles.label}>

              Sighting Address *

            </Text>



            <TextInput

              style={styles.input}

              placeholder="Enter the exact address"

              placeholderTextColor="#94A3B8"

              value={location}

              onChangeText={(text) => {

                setLocation(text);

                setValidationError("");

              }}

            />



            <View style={styles.locationButtonsRow}>
              <Pressable
                style={[
                  styles.locationButton,
                  styles.locationButtonHalf,
                  locationLoading && styles.disabledButton,
                ]}
                onPress={getCurrentLocation}
                disabled={locationLoading || submitting}
              >
                {locationLoading ? (
                  <>
                    <ActivityIndicator
                      color="#FFFFFF"
                      size="small"
                    />
                    <Text style={styles.locationButtonText}>
                      Getting...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.locationIcon}>⌖</Text>
                    <Text style={styles.locationButtonText}>
                      Use Current
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.locationButton,
                  styles.mapLocationButton,
                ]}
                onPress={openMap}
                disabled={submitting || locationLoading}
              >
                <Text style={styles.locationIcon}>⌖</Text>
                <Text style={styles.locationButtonText}>
                  Locate on Map
                </Text>
              </Pressable>
            </View>



            <Text style={styles.locationHint}>

              Your GPS position will be converted into a

              readable address while the coordinates are saved

              with the sighting.

            </Text>



            {latitude !== null && longitude !== null && (

              <View style={styles.gpsBox}>

                <Text style={styles.gpsTitle}>

                  Location captured

                </Text>

                <Text style={styles.gpsText}>

                  GPS coordinates recorded successfully.

                </Text>

              </View>

            )}



            <Text style={styles.label}>

              Sighting Date *

            </Text>



            <Pressable
              style={styles.datePickerField}
              onPress={() => setDatePickerVisible(true)}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.datePickerText,
                  !date && styles.datePickerPlaceholder,
                ]}
              >
                {date || "Select sighting date"}
              </Text>

              <Text style={styles.calendarIcon}>▣</Text>
            </Pressable>

            {datePickerVisible && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="calendar"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              </View>
            )}

            <Text style={styles.label}>

              Description

            </Text>



            <TextInput

              style={[styles.input, styles.textArea]}

              placeholder="Describe what you observed"

              placeholderTextColor="#94A3B8"

              value={description}

              onChangeText={setDescription}

              multiline

              numberOfLines={5}

              textAlignVertical="top"

            />

          </View>



          <View style={styles.formCard}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>

                  Photo Evidence

                </Text>

                <Text style={styles.sectionSubtitle}>

                  Add a photo when it is safe and appropriate

                </Text>

              </View>

            </View>



            <View style={styles.photoButtonsRow}>

              <Pressable

                style={styles.photoButton}

                onPress={takePhoto}

                disabled={submitting}

              >

                <Text style={styles.photoIcon}>▣</Text>

                <Text style={styles.photoButtonText}>

                  Take Photo

                </Text>

              </Pressable>



              <Pressable

                style={styles.photoButton}

                onPress={pickFromGallery}

                disabled={submitting}

              >

                <Text style={styles.photoIcon}>▧</Text>

                <Text style={styles.photoButtonText}>

                  Gallery

                </Text>

              </Pressable>

            </View>



            {photoUri && (

              <View style={styles.previewBox}>

                <View style={styles.previewHeader}>

                  <View>

                    <Text style={styles.previewTitle}>

                      Photo selected

                    </Text>

                    <Text

                      style={styles.previewName}

                      numberOfLines={1}

                    >

                      {photoName || "safefind-photo.jpg"}

                    </Text>

                  </View>



                  <View style={styles.evidenceBadge}>

                    <Text style={styles.evidenceBadgeText}>

                      EVIDENCE

                    </Text>

                  </View>

                </View>



                <Image

                  source={{ uri: photoUri }}

                  style={styles.preview}

                  resizeMode="cover"

                />



                <Pressable

                  style={styles.removeButton}

                  onPress={removePhoto}

                  disabled={submitting}

                >

                  <Text style={styles.removeButtonText}>

                    Remove Photo

                  </Text>

                </Pressable>

              </View>

            )}

          </View>



          {validationError ? (

            <View style={styles.validationBox}>

              <Text style={styles.validationIcon}>!</Text>

              <Text style={styles.validationText}>

                {validationError}

              </Text>

            </View>

          ) : null}



          <Pressable

            style={[

              styles.submitButton,

              submitting && styles.disabledButton,

            ]}

            onPress={submitSighting}

            disabled={submitting}

          >

            {submitting ? (

              <>

                <ActivityIndicator

                  color="#FFFFFF"

                  size="small"

                />

                <Text style={styles.submitText}>

                  Uploading & submitting...

                </Text>

              </>

            ) : (

              <Text style={styles.submitText}>

                Submit Sighting

              </Text>

            )}

          </Pressable>



          <Pressable

            style={styles.backButton}

            onPress={() => router.back()}

            disabled={submitting}

          >

            <Text style={styles.backButtonText}>

              Back

            </Text>

          </Pressable>



          <Text style={styles.privateNote}>

            Sighting information is submitted privately for

            authorized review.

          </Text>

        </View>

      </ScrollView>

      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setMapVisible(false)}
      >
        <SafeAreaView style={styles.mapModalSafeArea}>
          <View style={styles.mapModalHeader}>
            <View style={styles.mapModalTitleWrap}>
              <Text style={styles.mapModalTitle}>Locate on Map</Text>
              <Text style={styles.mapModalSubtitle}>
                Tap the map to choose the sighting location
              </Text>
            </View>

            <Pressable
              style={styles.mapCloseButton}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.mapCloseText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.mapWebViewWrap}>
            <WebView
              source={{ html: mapHtml }}
              onMessage={handleMapMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              setSupportMultipleWindows={false}
            />
          </View>

          <View style={styles.mapFooter}>
            {mapSelectedLatitude !== null && mapSelectedLongitude !== null ? (
              <Text style={styles.mapSelectedText}>
                Selected: {mapSelectedLatitude.toFixed(6)}, {mapSelectedLongitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.mapSelectedText}>
                Tap anywhere on the map to select a point.
              </Text>
            )}

            <View style={styles.mapFooterButtons}>
              <Pressable
                style={styles.mapCancelButton}
                onPress={() => setMapVisible(false)}
              >
                <Text style={styles.mapCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.mapUseButton,
                  (mapSelectedLatitude === null || mapSelectedLongitude === null) &&
                    styles.mapUseButtonDisabled,
                ]}
                onPress={useSelectedMapLocation}
                disabled={
                  mapSelectedLatitude === null ||
                  mapSelectedLongitude === null ||
                  locationLoading
                }
              >
                {locationLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.mapUseText}>Use This Location</Text>
                )}
              </Pressable>
            </View>
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



  center: {

    flex: 1,

    backgroundColor: "#F8FAFC",

    justifyContent: "center",

    alignItems: "center",

    padding: 20,

  },



  loadingCard: {

    width: "100%",

    maxWidth: 360,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    padding: 28,

    alignItems: "center",

  },



  loadingTitle: {

    marginTop: 14,

    color: "#0F172A",

    fontSize: 18,

    fontWeight: "900",

  },



  loadingText: {

    marginTop: 6,

    color: "#64748B",

    fontSize: 13,

    lineHeight: 19,

    textAlign: "center",

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

    fontSize: 26,

    fontWeight: "900",

  },



  introTextContainer: {

    flex: 1,

  },



  title: {

    color: "#0F172A",

    fontSize: 24,

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

    alignItems: "flex-start",

    backgroundColor: "#EFF6FF",

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#D9E6F7",

    padding: 14,

    marginTop: 14,

  },



  noticeIcon: {

    width: 30,

    height: 30,

    borderRadius: 10,

    backgroundColor: "#2563EB",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 10,

  },



  noticeIconText: {

    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "900",

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

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 16,

  },



  sectionTitle: {

    color: "#0F172A",

    fontSize: 18,

    fontWeight: "900",

  },



  sectionSubtitle: {

    color: "#64748B",

    fontSize: 12,

    lineHeight: 17,

    marginTop: 3,

  },



  verifiedBadge: {

    paddingHorizontal: 9,

    paddingVertical: 6,

    borderRadius: 9,

    backgroundColor: "#EFF6FF",

  },



  verifiedText: {

    color: "#2563EB",

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 0.6,

  },



  personCard: {

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 16,

    padding: 14,

    marginBottom: 10,

  },



  personCardSelected: {

    borderColor: "#2563EB",

    backgroundColor: "#EFF6FF",

  },



  personCardTop: {

    flexDirection: "row",

    alignItems: "center",

  },



  avatar: {

    width: 46,

    height: 46,

    borderRadius: 14,

    backgroundColor: "#F1F5F9",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 11,

  },



  avatarSelected: {

    backgroundColor: "#DBEAFE",

  },



  avatarText: {

    color: "#475569",

    fontSize: 18,

    fontWeight: "900",

  },



  avatarTextSelected: {

    color: "#2563EB",

  },



  personMain: {

    flex: 1,

  },



  personName: {

    color: "#0F172A",

    fontSize: 16,

    fontWeight: "900",

  },



  personNameSelected: {

    color: "#1D4ED8",

  },



  caseLine: {

    color: "#64748B",

    fontSize: 12,

    marginTop: 4,

  },



  selectCircle: {

    width: 24,

    height: 24,

    borderRadius: 12,

    borderWidth: 2,

    borderColor: "#CBD5E1",

    alignItems: "center",

    justifyContent: "center",

    marginLeft: 8,

  },



  selectCircleSelected: {

    borderColor: "#2563EB",

    backgroundColor: "#2563EB",

  },



  selectCheck: {

    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "900",

  },



  personDetails: {

    marginTop: 13,

    paddingTop: 12,

    borderTopWidth: 1,

    borderTopColor: "#E2E8F0",

    gap: 8,

  },



  detailRow: {

    flexDirection: "row",

    alignItems: "flex-start",

  },



  detailLabel: {

    width: 72,

    color: "#94A3B8",

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 0.5,

    paddingTop: 2,

  },



  detailValue: {

    flex: 1,

    color: "#475569",

    fontSize: 12,

    lineHeight: 17,

    fontWeight: "700",

  },



  emptyBox: {

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 14,

    padding: 22,

    alignItems: "center",

  },



  emptyIcon: {

    width: 44,

    height: 44,

    borderRadius: 14,

    backgroundColor: "#EFF6FF",

    alignItems: "center",

    justifyContent: "center",

  },



  emptyIconText: {

    color: "#2563EB",

    fontSize: 22,

    fontWeight: "900",

  },



  emptyTitle: {

    color: "#0F172A",

    fontSize: 16,

    fontWeight: "900",

    marginTop: 12,

    textAlign: "center",

  },



  emptyText: {

    color: "#64748B",

    fontSize: 12,

    lineHeight: 18,

    marginTop: 5,

    textAlign: "center",

  },



  label: {

    color: "#334155",

    fontSize: 12,

    fontWeight: "800",

    marginBottom: 7,

    marginTop: 2,

  },



  input: {

    minHeight: 52,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    borderRadius: 12,

    paddingHorizontal: 14,

    paddingVertical: 12,

    backgroundColor: "#FFFFFF",

    fontSize: 15,

    color: "#0F172A",

  },



  locationButtonsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
  },

  locationButtonHalf: {
    flex: 1,
    marginTop: 0,
  },

  mapLocationButton: {
    flex: 1,
    marginTop: 0,
    backgroundColor: "#1D4ED8",
  },

  locationButton: {

    minHeight: 50,

    borderRadius: 12,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    gap: 9,

    marginTop: 10,

  },



  locationIcon: {

    color: "#FFFFFF",

    fontSize: 19,

    fontWeight: "700",

  },



  locationButtonText: {

    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "800",

  },



  disabledButton: {

    opacity: 0.65,

  },



  locationHint: {

    marginTop: 8,

    fontSize: 11,

    lineHeight: 17,

    color: "#64748B",

  },



  gpsBox: {

    marginTop: 10,

    backgroundColor: "#EFF6FF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

    borderRadius: 11,

    padding: 11,

  },



  gpsTitle: {

    fontSize: 12,

    fontWeight: "900",

    color: "#1D4ED8",

  },



  gpsText: {

    fontSize: 11,

    color: "#475569",

    lineHeight: 17,

    marginTop: 2,

  },



  mapModalSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mapModalHeader: {
    minHeight: 76,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  mapModalTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },

  mapModalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  mapModalSubtitle: {
    color: "#DBEAFE",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  mapCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  mapCloseText: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
    marginTop: -2,
  },

  mapWebViewWrap: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },

  mapFooter: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },

  mapSelectedText: {
    color: "#475569",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },

  mapFooterButtons: {
    flexDirection: "row",
    gap: 9,
  },

  mapCancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  mapCancelText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },

  mapUseButton: {
    flex: 1.35,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  mapUseButtonDisabled: {
    opacity: 0.5,
  },

  mapUseText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  datePickerField: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },

  datePickerPlaceholder: {
    color: "#94A3B8",
    fontWeight: "400",
  },

  calendarIcon: {
    fontSize: 18,
    color: "#2563EB",
    marginLeft: 10,
  },

  datePickerContainer: {
    marginTop: 8,
    alignItems: "flex-start",
  },

  textArea: {

    minHeight: 115,

    paddingTop: 14,

    textAlignVertical: "top",

    marginBottom: 2,

  },



  photoButtonsRow: {

    flexDirection: "row",

    gap: 10,

  },



  photoButton: {

    flex: 1,

    minHeight: 50,

    borderRadius: 12,

    backgroundColor: "#EFF6FF",

    borderWidth: 1,

    borderColor: "#D9E6F7",

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    gap: 7,

  },



  photoIcon: {

    color: "#2563EB",

    fontSize: 17,

    fontWeight: "900",

  },



  photoButtonText: {

    color: "#1D4ED8",

    fontSize: 13,

    fontWeight: "800",

  },



  previewBox: {

    marginTop: 14,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 14,

    padding: 12,

  },



  previewHeader: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 10,

  },



  previewTitle: {

    color: "#0F172A",

    fontSize: 13,

    fontWeight: "900",

  },



  previewName: {

    color: "#64748B",

    fontSize: 11,

    marginTop: 2,

    maxWidth: 190,

  },



  evidenceBadge: {

    backgroundColor: "#DBEAFE",

    borderRadius: 8,

    paddingHorizontal: 8,

    paddingVertical: 5,

  },



  evidenceBadgeText: {

    color: "#2563EB",

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 0.5,

  },



  preview: {

    width: "100%",

    height: 230,

    borderRadius: 11,

    backgroundColor: "#E2E8F0",

  },



  removeButton: {

    marginTop: 10,

    height: 42,

    borderRadius: 10,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#FCA5A5",

    justifyContent: "center",

    alignItems: "center",

  },



  removeButtonText: {

    color: "#DC2626",

    fontSize: 12,

    fontWeight: "800",

  },



  validationBox: {

    marginTop: 16,

    backgroundColor: "#FEF2F2",

    borderWidth: 1,

    borderColor: "#FCA5A5",

    borderRadius: 12,

    padding: 12,

    flexDirection: "row",

    alignItems: "flex-start",

  },



  validationIcon: {

    width: 22,

    height: 22,

    borderRadius: 11,

    backgroundColor: "#DC2626",

    color: "#FFFFFF",

    textAlign: "center",

    fontSize: 13,

    fontWeight: "900",

    lineHeight: 22,

    marginRight: 8,

  },



  validationText: {

    flex: 1,

    color: "#B91C1C",

    fontSize: 13,

    lineHeight: 18,

    fontWeight: "700",

  },



  submitButton: {

    minHeight: 54,

    borderRadius: 14,

    backgroundColor: "#2563EB",

    marginTop: 16,

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    gap: 10,

  },



  submitText: {

    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "900",

  },



  backButton: {

    height: 50,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: "#CBD5E1",

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 10,

  },



  backButtonText: {

    color: "#475569",

    fontSize: 15,

    fontWeight: "800",

  },



  privateNote: {

    textAlign: "center",

    fontSize: 11,

    lineHeight: 17,

    color: "#94A3B8",

    marginTop: 16,

  },

});
