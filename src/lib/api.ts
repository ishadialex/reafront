import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string = API_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // CRITICAL: Allow cross-origin requests with Authorization headers
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("accessToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Don't auto-refresh for endpoints where 401 is a valid business response
        const skipRefreshUrls = [
          "/api/settings/password",
          "/api/settings/account",              // Wrong password during account deletion
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/force-login",              // Wrong password during force login
          "/api/2fa/enable",                    // Wrong 2FA code during setup
          "/api/2fa/disable",                   // Wrong password when disabling
          "/api/2fa/backup-codes/regenerate",   // Wrong 2FA code when regenerating
        ];

        const requestUrl = error.config?.url || "";
        const shouldSkipRefresh = skipRefreshUrls.some(url => requestUrl.includes(url));

        if (error.response?.status === 401 && !shouldSkipRefresh) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const response = await axios.post(`${baseURL}/api/auth/refresh-token`, {
                refreshToken,
              });
              const { accessToken, refreshToken: newRefreshToken } = response.data.data;
              localStorage.setItem("accessToken", accessToken);
              localStorage.setItem("refreshToken", newRefreshToken); // ← Save the NEW refresh token!

              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${accessToken}`;
                return axios.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              this.clearToken();
              if (typeof window !== "undefined") {
                window.location.href = "/signin";
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
  }

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  // Public endpoints
  async getTeamMembers() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/team");
    return response.data;
  }

  async getTestimonials() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/testimonials");
    return response.data;
  }

  async getInvestmentOptions() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/public/investments");
    return response.data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any; accessToken: string; refreshToken: string }>>(
      "/api/auth/login",
      { email, password }
    );
    return response.data;
  }

  async forceLogin(email: string, password: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any; accessToken: string; refreshToken: string; message: string }>>(
      "/api/auth/force-login",
      { email, password }
    );
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any }>>(
      "/api/auth/register",
      data
    );
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/auth/forgot-password",
      { email }
    );
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/auth/reset-password",
      { token, newPassword }
    );
    return response.data;
  }

  async logout() {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
    const response = await this.axiosInstance.post<ApiResponse<void>>("/api/auth/logout", {
      refreshToken,
    });
    this.clearToken();
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      "/api/auth/refresh-token",
      { refreshToken }
    );
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.axiosInstance.get<ApiResponse<any>>("/api/profile");
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.axiosInstance.put<ApiResponse<any>>("/api/profile", data);
    return response.data;
  }

  async getTransactions(limit?: number, type?: string) {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (type) params.set("type", type);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(`/api/transactions${query}`);
    return response.data;
  }

  async getBalanceSummary() {
    const response = await this.axiosInstance.get<ApiResponse<{
      balance: number;
      pendingDeposits: number;
      pendingWithdrawals: number;
      breakdown: {
        deposits: number;
        profits: number;
        adminBonuses: number;
        referralBonuses: number;
        transferIn: number;
        withdrawals: number;
        investedFunds: number;
        transferOut: number;
      };
    }>>("/api/transactions/balance");
    return response.data;
  }

  async getNotifications() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/notifications");
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.axiosInstance.patch<ApiResponse<void>>(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.axiosInstance.put<ApiResponse<void>>("/api/notifications/read-all");
    return response.data;
  }

  async clearAllNotifications() {
    const response = await this.axiosInstance.delete<ApiResponse<void>>("/api/notifications");
    return response.data;
  }

  async getSupportTickets() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/support");
    return response.data;
  }

  async getSupportTicket(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/support/${id}`);
    return response.data;
  }

  async createSupportTicket(data: {
    subject: string;
    category: string;
    priority: string;
    message: string;
    attachmentIds?: string[];
  }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/support", data);
    return response.data;
  }

  async replySupportTicket(id: string, data: { message: string; attachmentIds?: string[] }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>(`/api/support/${id}/reply`, data);
    return response.data;
  }

  async updateSupportTicket(id: string, data: { status?: string }) {
    const response = await this.axiosInstance.put<ApiResponse<any>>(`/api/support/${id}`, data);
    return response.data;
  }

  async uploadSupportAttachment(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await this.axiosInstance.post<ApiResponse<any>>(
      "/api/support/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  async getProperties(filters?: { category?: string; investmentType?: string; status?: string; search?: string }) {
    let url = "/api/properties";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.investmentType) params.append("investmentType", filters.investmentType);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (params.toString()) url += `?${params.toString()}`;
    }
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getProperty(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/properties/${id}`);
    return response.data;
  }

  async getFeaturedProperties() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/properties/featured");
    return response.data;
  }

  async getInvestments() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/investments");
    return response.data;
  }

  async createPropertyInvestment(propertyId: string, amount: number) {
    const response = await this.axiosInstance.post<ApiResponse<{ id: string }>>("/api/investments/property", { propertyId, amount });
    return response.data;
  }

  async getReferralStats() {
    const response = await this.axiosInstance.get<ApiResponse<any>>("/api/referral");
    return response.data;
  }

  async getSettings() {
    const response = await this.axiosInstance.get<ApiResponse<any>>("/api/settings");
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.axiosInstance.put<ApiResponse<any>>("/api/settings", data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.axiosInstance.put<ApiResponse<null>>(
      "/api/settings/password",
      { currentPassword, newPassword }
    );
    return response.data;
  }

  async getSessions() {
    const response = await this.axiosInstance.get<ApiResponse<any[]>>("/api/sessions");
    return response.data;
  }

  async terminateSession(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<void>>(`/api/sessions/${id}`);
    return response.data;
  }

  async deleteAccount(password: string) {
    const response = await this.axiosInstance.delete<ApiResponse<null>>("/api/settings/account", {
      data: { password },
    });
    return response.data;
  }

  // Two-Factor Authentication endpoints
  async get2FAStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{ enabled: boolean; backupCodesCount: number }>>("/api/2fa/status");
    return response.data;
  }

  async setup2FA() {
    const response = await this.axiosInstance.post<ApiResponse<{ secret: string; qrCode: string; manualEntry: string }>>("/api/2fa/setup");
    return response.data;
  }

  async enable2FA(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ enabled: boolean; backupCodes: string[] }>>("/api/2fa/enable", { code });
    return response.data;
  }

  async disable2FA(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ disabled: boolean }>>("/api/2fa/disable", { code });
    return response.data;
  }

  async regenerateBackupCodes(code: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ backupCodes: string[] }>>("/api/2fa/backup-codes/regenerate", { code });
    return response.data;
  }

  // Payment Methods endpoints
  async getPaymentMethods(type?: "bank" | "crypto") {
    const url = type ? `/api/payment-methods?type=${type}` : "/api/payment-methods";
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getPaymentMethodById(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/payment-methods/${id}`);
    return response.data;
  }

  // Fund Operations endpoints
  async createDeposit(data: { method: string; amount: number; details?: any }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/fund-operations/deposit", data);
    return response.data;
  }

  async createWithdrawal(data: { method: string; amount: number; details?: any }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/fund-operations/withdrawal", data);
    return response.data;
  }

  async uploadPaymentReceipt(reference: string, file: File) {
    const formData = new FormData();
    formData.append("reference", reference);
    formData.append("receipt", file);
    const response = await this.axiosInstance.post<ApiResponse<null>>(
      "/api/fund-operations/upload-receipt",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  async getFundOperations(type?: "deposit" | "withdrawal", status?: string) {
    let url = "/api/fund-operations";
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await this.axiosInstance.get<ApiResponse<any[]>>(url);
    return response.data;
  }

  async getFundOperationById(id: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/api/fund-operations/${id}`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
