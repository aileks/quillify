import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NotificationState {
  accountDeleted: boolean;
  setAccountDeleted: (deleted: boolean) => void;
  clearAccountDeleted: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      accountDeleted: false,
      setAccountDeleted: (deleted) => set({ accountDeleted: deleted }),
      clearAccountDeleted: () => set({ accountDeleted: false }),
    }),
    {
      name: 'quillify-notifications',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
