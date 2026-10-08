import { Platform, Share, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { baseUrl } from "../../Global/Config";

interface PdfDownloadResult {
  uri: string;
  base64?: string;
}

const PDF_MIME = "application/pdf";
const PDF_UTI = "com.adobe.pdf";
const FLAG_GRANT_READ_URI_PERMISSION = 1;

async function getToken(): Promise<string> {
  const token = await AsyncStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Your session has expired. Please login again.");
  }
  return token;
}

async function isPdfFile(fileUri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || !("size" in info) || info.size <= 0) {
      return false;
    }
    if (info.size > 5 * 1024 * 1024) {
      return true;
    }
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64",
    });
    return base64.startsWith("JVBERi");
  } catch {
    return false;
  }
}

export async function downloadPdf(
  endpoint: string,
  fileName: string
): Promise<PdfDownloadResult> {
  const token = await getToken();
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const fileUri = `${FileSystem.cacheDirectory}${safeName}`;

  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch {
    // ignore: stale file removal is best effort
  }

  const result = await FileSystem.downloadAsync(`${baseUrl}${endpoint}`, fileUri, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: PDF_MIME,
    },
  });

  if (result.status !== 200) {
    throw new Error("Unable to download the document. Please try again.");
  }

  if (!(await isPdfFile(result.uri))) {
    throw new Error(
      "The downloaded file is not a valid PDF. Please try again later."
    );
  }

  return { uri: result.uri };
}

export async function readPdfAsBase64(fileUri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(fileUri, {
    encoding: "base64",
  });
}

async function sharePdfFile(fileUri: string, title?: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: PDF_MIME,
      dialogTitle: title || "Open PDF",
      UTI: PDF_UTI,
    });
    return;
  }
  if (Platform.OS === "ios") {
    await Share.share({ url: fileUri, title });
    return;
  }
  throw new Error("No PDF viewer is available on this device.");
}

export async function openPdfExternally(fileUri: string): Promise<void> {
  if (Platform.OS === "android") {
    try {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: PDF_MIME,
        flags: FLAG_GRANT_READ_URI_PERMISSION,
      });
      return;
    } catch {
      // fall through to the share sheet
    }
  }
  await sharePdfFile(fileUri, "Open PDF");
}

export async function sharePdf(fileUri: string, title: string): Promise<void> {
  await sharePdfFile(fileUri, title);
}

export function getPdfDataUri(base64: string): string {
  return `data:${PDF_MIME};base64,${base64}`;
}

export async function openUrlExternally(url: string): Promise<void> {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    throw new Error("Unable to open the link on this device.");
  }
  await Linking.openURL(url);
}
