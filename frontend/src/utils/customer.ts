import type { Customer } from "../types";

export const getCustomerId = (customer: Customer): string => customer._id ?? "";

export const getAxiosErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};
