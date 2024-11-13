import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IUserState {
  user_id: string | null;
  setUser: (user_id: string) => void;
  removeAllUser: () => void;
  updateUser: (new_user_id: string) => void;
}

export const useStore = create(
  persist<IUserState>(
    (set) => ({
      user_id: null,
      setUser: (user_id: string) => set(() => ({ user_id })),
      removeAllUser: () => set({ user_id: null }),
      updateUser: (new_user_id: string) => set({ user_id: new_user_id }),
    }),
    {
      name: "user-storage",
    }
  )
);
