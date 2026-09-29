const base = "/api";
let csrf: string | undefined;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (method !== "GET" && !csrf)
    csrf = (await api<{ token: string }>("/auth/csrf")).token;
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { "X-CSRF-TOKEN": csrf! } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Please try again later.",
      0,
    );
  }
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 403) csrf = undefined;
    throw new ApiError(data?.message || "Server error", response.status);
  }
  if (path === "/auth/logout" || path === "/auth/login") csrf = undefined;
  return data;
}
export type User = {
  id: number;
  name: string;
  email: string;
  city: string;
  bio: string;
};
export type Request = {
  selectedResponseId: number | null;
  rewardStars: number;
  completedAt: string | null;
  id: number;
  authorId: number;
  title: string;
  description: string;
  city: string;
  category: string;
  status: string;
  createdAt: string;
};
export type Offer = {
  id: number;
  helperId: number;
  name: string;
  message: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
};
export type RewardsSummary = {
  balance: number;
  helpedCount: number;
  total: number;
  items: {
    requestId: number;
    title: string;
    stars: number;
    completedAt: string;
  }[];
};
export type Lot = {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  celebrity: string;
  charity: string;
  startPrice: number;
  currentPrice: number;
  startsAt: string;
  endsAt: string;
  closed: boolean;
  winnerId: number | null;
};
export type Wish = {
  id: number;
  authorId: number;
  title: string;
  description: string;
  supporterId: number | null;
  status: string;
};
export type Star = {
  id: number;
  userId: number;
  name: string;
  city: string;
  story: string;
};
export type Page<T> = { items: T[]; total: number };
