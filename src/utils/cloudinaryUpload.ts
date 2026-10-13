import { Platform } from "react-native";

const CLOUD_NAME = "a8cmmpxg";
const UPLOAD_PRESET = "safefind_images";

type ImageData = {
  base64: string;
  mimeType?: string;
};

export async function uploadImageToCloudinary(image: ImageData) {
  try {
    if (!image.base64) {
      throw new Error("Image data is missing.");
    }

    const mimeType = image.mimeType || "image/jpeg";

    const dataUri = image.base64.startsWith("data:")
      ? image.base64
      : `data:${mimeType};base64,${image.base64}`;

    const formBody = new URLSearchParams();

    formBody.append("file", dataUri);
    formBody.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }
    );

    const data = await response.json();

console.log("CLOUDINARY RESPONSE:", data);

if (!response.ok) {
  throw new Error(
    data.error?.message || "Cloudinary upload failed"
  );
}

if (!data.secure_url) {
  throw new Error(
    "Cloudinary upload succeeded but no image URL was returned."
  );
}

console.log("CLOUDINARY IMAGE URL:", data.secure_url);

return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}
