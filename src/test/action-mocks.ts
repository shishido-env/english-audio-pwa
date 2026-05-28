import { vi } from "vitest";

export const mockAuth = vi.fn().mockResolvedValue({ userId: "user_test_123" });
export const mockRevalidatePath = vi.fn();
export const mockGetDb = vi.fn();

export function resetActionMocks(): void {
  mockAuth.mockClear();
  mockAuth.mockResolvedValue({ userId: "user_test_123" });
  mockRevalidatePath.mockClear();
  mockGetDb.mockClear();
}

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/db/client", () => ({
  getDb: mockGetDb,
}));
