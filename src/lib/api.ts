import { API_BASE_URL } from "./constants";

type RequestOptions = {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
};

class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private async refreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const rt = localStorage.getItem("refreshToken");
    if (!rt) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken?: string;
      };
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      return data.accessToken;
    } catch {
      return null;
    }
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean>
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v))
      );
    }
    return url.toString();
  }

  private buildHeaders(token: string | null): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const token = this.getToken();
    const url = this.buildUrl(path, options?.params);
    const init: RequestInit = {
      method,
      headers: this.buildHeaders(token),
      ...(options?.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    };

    let res = await fetch(url, init);

    if (res.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        (init.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${newToken}`;
        res = await fetch(url, init);
      } else {
        // Don't nuke the session — the admin token may still be valid
        // Just throw so the caller can handle it gracefully
        throw new Error("Session expirée");
      }
    }

    if (!res.ok) {
      let message = `Erreur HTTP ${res.status}`;
      try {
        const err = (await res.json()) as { message?: string };
        if (err.message) message = err.message;
      } catch {
        // ignore parse error
      }
      throw new Error(message);
    }

    // Handle empty responses (204)
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

export const apiClient = new ApiClient();
