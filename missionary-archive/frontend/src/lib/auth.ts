"use client";
import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("archive_token") : null,
  setAuth: (user, token) => {
    if (typeof window !== "undefined") localStorage.setItem("archive_token", token);
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("archive_token");
    set({ user: null, token: null });
  },
  isAuthenticated: () => !!get().token,
}));
