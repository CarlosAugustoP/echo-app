import { ApiService } from "./ApiService";
import { getAccessToken } from "./authStorage";

export const apiClient = new ApiService({
  getAccessToken,
});
