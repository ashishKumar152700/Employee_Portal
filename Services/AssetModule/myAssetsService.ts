// Services/AssetModule/myAssetsService.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimesheetProdUrl } from "../../Global/Config";

const base_url = TimesheetProdUrl;

export interface MyAsset {
  id: number;
  code: string;
  serial: string;
  manufacturer: string;
  model: string;
  country: string;
  location: string;
  issuedAt: string | null;
  status: string;
  vendorName: string;
  purchaseDate: string | null;
  warrantyExpiredDate: string | null;
  warrantyAmcStatus: string;
  cpu: string;
  hdd: string;
  memory: string;
  operatingSystem: string;
  accessories: string;
  remarks: string;
}

/** Assets currently allocated to the logged-in user. */
export const getMyAssets = async (): Promise<MyAsset[]> => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  try {
    const response = await axios.get(`${base_url}/asset/myAssets`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(
      " [MyAssets Service] Error fetching assets:",
      error?.response?.status,
      error?.message
    );
    throw new Error(
      error?.response?.status
        ? `Failed to load your assets (HTTP ${error.response.status}).`
        : "Failed to load your assets. Please check your connection."
    );
  }
};
