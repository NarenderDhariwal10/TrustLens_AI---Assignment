import axios from "axios";
import type { VerifyResponse } from "../types";

/** Production: set VITE_API_URL to your API origin. Dev: leave unset (uses Vite proxy). */
const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export const api = axios.create({
  baseURL,
  timeout: 600000,
});

export async function verifyPdf(file: File): Promise<VerifyResponse> {
  const form = new FormData();
  form.append("file", file);

  // Do not set Content-Type: multipart uploads need the browser-generated boundary.
  const { data } = await api.post<VerifyResponse>("/api/verify", form);

  return data;
}
