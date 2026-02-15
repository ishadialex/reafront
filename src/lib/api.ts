import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<(retry: boolean) => void> = [];

  constructor(baseURL: string = API_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // CRITICAL: Send httpOnly cookies with every request
    });

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
          "/api/auth/validate-session",         // Session revoked - logout immediately
          "/api/2fa/enable",                    // Wrong 2FA code during setup
          "/api/2fa/disable",                   // Wrong password when disabling
          "/api/2fa/backup-codes/regenerate",   // Wrong 2FA code when regenerating
          "/api/transfers",                     // Wrong 2FA code during transfer
          "/api/fund-operations/withdrawal",    // Wrong 2FA code during withdrawal
        ];

        const requestUrl = error.config?.url || "";
        const shouldSkipRefresh = skipRefreshUrls.some(url => requestUrl.includes(url));

        // Only handle TOKEN_EXPIRED (or generic 401) for non-skip URLs
        const errorCode = (error.response?.data as any)?.code;
        const isTokenExpired =
          error.response?.status === 401 &&
          !shouldSkipRefresh &&
          errorCode !== "INVALID_TOKEN";

        if (!isTokenExpired) {
          return Promise.reject(error);
        }

        // If a refresh is already in flight, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.refreshQueue.push((success: boolean) => {
              if (success && error.config) {
                resolve(this.axiosInstance.request(error.config));
              } else {
                reject(error);
              }
            });
          });
        }

        // This request is the one doing the refresh
        this.isRefreshing = true;
        try {
          await axios.post(
            `${baseURL}/api/auth/refresh-token`,
            {},
            { withCredentials: true }
          );

          // Flush the queue — all waiting requests can retry
          this.refreshQueue.forEach(cb => cb(true));
          this.refreshQueue = [];

          // Retry the original request that triggered the refresh
          if (error.config) {
            return this.axiosInstance.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed — reject all queued requests and redirect
          this.refreshQueue.forEach(cb => cb(false));
          this.refreshQueue = [];

          if (typeof window !== "undefined") {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userProfilePicture");
            window.dispatchEvent(new Event("authStateChanged"));
            window.location.href = "/signin?reason=session_expired";
          }
        } finally {
          this.isRefreshing = false;
        }

        return Promise.reject(error);
      }
    );
  }

  // Tokens are now stored in httpOnly cookies - no need for manual token management
  // These methods are kept for backwards compatibility but do nothing
  setToken(token: string) {
    // No-op: Tokens are now in httpOnly cookies managed by the server
  }

  clearToken() {
    // No-op: Cookies are cleared by the server on logout
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
    const response = await this.axiosInstance.post<ApiResponse<{ user: any }>>(
      "/api/auth/login",
      { email, password }
    );
    return response.data;
  }

  async forceLogin(email: string, password: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ user: any; message: string }>>(
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
    phone: string;
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
    // Refresh token is in httpOnly cookie, sent automatically
    const response = await this.axiosInstance.post<ApiResponse<void>>("/api/auth/logout", {});
    return response.data;
  }

  async refreshToken() {
    // Refresh token is in httpOnly cookie, sent automatically
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>(
      "/api/auth/refresh-token",
      {}
    );
    return response.data;
  }

  async validateSession() {
    const response = await this.axiosInstance.post<ApiResponse<{ valid: boolean; checkInterval: number }>>(
      "/api/auth/validate-session"
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

  async checkPropertyInvestment(propertyId: string) {
    const response = await this.axiosInstance.get<ApiResponse<{ exists: boolean; investment: any }>>(`/api/investments/property/${propertyId}/check`);
    return response.data;
  }

  async createPropertyInvestment(propertyId: string, amount: number) {
    const response = await this.axiosInstance.post<ApiResponse<{ id: string }>>("/api/investments/property", { propertyId, amount });
    return response.data;
  }

  // Referral endpoints
  async getReferralInfo() {
    const response = await this.axiosInstance.get<ApiResponse<{
      referralCode: string;
      referralLink: string;
    }>>("/api/referrals/info");
    return response.data;
  }

  async getReferralStats() {
    const response = await this.axiosInstance.get<ApiResponse<{
      totalReferrals: number;
      completedReferrals: number;
      pendingReferrals: number;
      totalEarnings: number;
      completedEarnings: number;
      pendingEarnings: number;
      recentActivity: any[];
    }>>("/api/referrals/stats");
    return response.data;
  }

  async getReferralList() {
    const response = await this.axiosInstance.get<ApiResponse<Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      reward: number;
      joinedAt: string;
    }>>>("/api/referrals/list");
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

  async setRequire2FALogin(require: boolean) {
    const response = await this.axiosInstance.post<ApiResponse<{ requireTwoFactorLogin: boolean }>>("/api/2fa/require-login", { require });
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
  async getWithdrawalAuthorizationStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      canWithdraw: boolean;
      twoFactorEnabled: boolean;
      kycVerified: boolean;
      kycStatus: string;
      reasons: string[];
    }>>("/api/fund-operations/withdrawal-authorization");
    return response.data;
  }

  async createDeposit(data: { method: string; amount: number; details?: any }) {
    const response = await this.axiosInstance.post<ApiResponse<any>>("/api/fund-operations/deposit", data);
    return response.data;
  }

  async createWithdrawal(data: {
    method: string;
    amount: number;
    details?: any;
    twoFactorCode: string;
  }) {
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

  // Transfer endpoints
  async getTransferData() {
    const response = await this.axiosInstance.get<ApiResponse<{
      balance: number;
      transfers: any[];
    }>>("/api/transfers");
    return response.data;
  }

  async getTransferAuthorizationStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      canTransfer: boolean;
      twoFactorEnabled: boolean;
      kycVerified: boolean;
      kycStatus: string;
      reasons: string[];
    }>>("/api/transfers/authorization-status");
    return response.data;
  }

  async createTransfer(data: {
    recipientEmail: string;
    amount: number;
    note?: string;
    twoFactorCode: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      transfer: any;
      balance: number;
      recipientExists: boolean;
    }>>("/api/transfers", data);
    return response.data;
  }

  // KYC endpoints
  async getKYCStatus() {
    const response = await this.axiosInstance.get<ApiResponse<{
      kyc: {
        id: string;
        fullName: string;
        dateOfBirth: string;
        nationality: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        idFrontUrl: string | null;
        idBackUrl: string | null;
        proofOfAddressUrl: string | null;
        selfieUrl: string | null;
        documentType: string;
        documentNumber: string;
        status: "not_submitted" | "pending" | "approved" | "rejected";
        submittedAt: string | null;
        reviewedAt: string | null;
        rejectionReason: string;
        createdAt: string;
        updatedAt: string;
      };
    }>>("/api/kyc/status");
    return response.data;
  }

  async submitKYC(data: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    idFrontUrl: string;
    idBackUrl: string;
    proofOfAddressUrl: string;
    selfieUrl: string;
    documentType: string;
    documentNumber: string;
  }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      kyc: {
        id: string;
        status: string;
        submittedAt: string;
      };
    }>>("/api/kyc/submit", data);
    return response.data;
  }

  async updateKYC(data: {
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    proofOfAddressUrl?: string;
    selfieUrl?: string;
    documentType?: string;
    documentNumber?: string;
  }) {
    const response = await this.axiosInstance.put<ApiResponse<{ kyc: any }>>("/api/kyc/update", data);
    return response.data;
  }

  async uploadKYCDocument(file: File, documentType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    const response = await this.axiosInstance.post<ApiResponse<{ fileUrl: string }>>(
      "/api/kyc/upload-document",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  // Newsletter endpoints
  async subscribeToNewsletter(data: { name: string; email: string }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      message: string;
    }>>("/api/newsletter/subscribe", data);
    return response.data;
  }

  // Contact endpoints
  async submitContact(data: { name: string; email: string; phone: string; message: string }) {
    const response = await this.axiosInstance.post<ApiResponse<{
      message: string;
    }>>("/api/contact", data);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
