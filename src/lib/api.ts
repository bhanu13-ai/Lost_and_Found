import type {
  ClaimStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
  LostFoundItem,
  OwnershipClaim,
  PortalNotification,
  PortalStats,
  PortalUser,
  UserRole,
} from '../types/portal';

const TOKEN_KEY = 'sai_portal_jwt';
const USER_KEY = 'sai_portal_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): PortalUser | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalUser;
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: PortalUser, rememberMe: boolean): void {
  clearStoredSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  auth: {
    register(payload: {
      fullName: string;
      email: string;
      studentId: string;
      password: string;
      confirmPassword: string;
      role: UserRole;
      department?: string;
    }) {
      return request<{ message: string; token: string; user: PortalUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    login(payload: { email: string; password: string; rememberMe: boolean }) {
      return request<{ message: string; token: string; user: PortalUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    me() {
      return request<{ user: PortalUser }>('/api/auth/me');
    },
  },

  items: {
    list(params?: {
      type?: ItemType | 'all';
      category?: ItemCategory | 'All';
      status?: ItemStatus | 'All';
      search?: string;
      sort?: 'newest' | 'oldest';
      mine?: boolean;
    }) {
      const qs = new URLSearchParams();
      if (params?.type && params.type !== 'all') qs.set('type', params.type);
      if (params?.category && params.category !== 'All') qs.set('category', params.category);
      if (params?.status && params.status !== 'All') qs.set('status', params.status);
      if (params?.search) qs.set('search', params.search);
      if (params?.sort) qs.set('sort', params.sort);
      if (params?.mine) qs.set('mine', 'true');
      const query = qs.toString();
      return request<{ items: LostFoundItem[]; stats: PortalStats }>(`/api/items${query ? `?${query}` : ''}`);
    },

    get(id: string) {
      return request<{
        item: LostFoundItem;
        claims: OwnershipClaim[];
        claimCount: number;
        potentialMatches: LostFoundItem[];
      }>(`/api/items/${id}`);
    },

    create(payload: {
      type: ItemType;
      title: string;
      category: ItemCategory;
      description: string;
      location: string;
      dateOccurred: string;
      imageUrl?: string;
      contactPreference: string;
      identifyingNote?: string;
    }) {
      return request<{ message: string; item: LostFoundItem }>('/api/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update(
      id: string,
      payload: Partial<{ status: ItemStatus; title: string; description: string; location: string }>
    ) {
      return request<{ message: string; item: LostFoundItem }>(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    delete(id: string) {
      return request<{ message: string }>(`/api/items/${id}`, {
        method: 'DELETE',
      });
    },
  },

  claims: {
    list() {
      return request<{ claims: OwnershipClaim[] }>('/api/claims');
    },

    create(payload: {
      itemId: string;
      proofDescription: string;
      distinctiveMarks: string;
      lostDateApprox: string;
    }) {
      return request<{ message: string; claim: OwnershipClaim }>('/api/claims', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update(id: string, payload: { status: ClaimStatus; staffNotes?: string }) {
      return request<{ message: string; claim: OwnershipClaim }>(`/api/claims/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  },

  upload: {
    image(file: File) {
      const formData = new FormData();
      formData.append('image', file);
      return request<{ imageUrl: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },

  notifications: {
    list() {
      return request<{ notifications: PortalNotification[] }>('/api/notifications');
    },
    markRead(id: string) {
      return request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    markAllRead() {
      return request<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' });
    },
  },
};
