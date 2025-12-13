import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Separate store for sessionStorage-persisted banner dismissal state
interface BannerState {
  dismissed: Record<string, boolean>;
  dismiss: (userId: string) => void;
  isDismissed: (userId: string) => boolean;
}

export const useBannerStore = create<BannerState>()(
  persist(
    (set, get) => ({
      dismissed: {},
      dismiss: (userId) =>
        set((state) => ({
          dismissed: { ...state.dismissed, [userId]: true },
        })),
      isDismissed: (userId) => get().dismissed[userId] === true,
    }),
    {
      name: 'quillify-verification-banner',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Main verification store with localStorage persistence for toast shown state
interface VerificationState {
  // Persisted to localStorage (permanent per-user)
  toastShownForUsers: Record<string, boolean>;

  // Not persisted (ephemeral, resets on page reload)
  toastPendingForUsers: Record<string, boolean>;

  // Actions
  markToastShown: (userId: string) => void;
  setToastPending: (userId: string, pending: boolean) => void;
  dismissBanner: (userId: string) => void;

  // Selectors
  shouldShowToast: (userId: string) => boolean;
  shouldShowBanner: (userId: string, needsVerification: boolean) => boolean;
}

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set, get) => ({
      toastShownForUsers: {},
      toastPendingForUsers: {},

      markToastShown: (userId) =>
        set((state) => ({
          toastShownForUsers: { ...state.toastShownForUsers, [userId]: true },
          toastPendingForUsers: { ...state.toastPendingForUsers, [userId]: false },
        })),

      setToastPending: (userId, pending) =>
        set((state) => ({
          toastPendingForUsers: { ...state.toastPendingForUsers, [userId]: pending },
        })),

      dismissBanner: (userId) => {
        useBannerStore.getState().dismiss(userId);
      },

      shouldShowToast: (userId) => {
        const state = get();
        const alreadyShown = state.toastShownForUsers[userId] === true;
        const isPending = state.toastPendingForUsers[userId] === true;
        return !alreadyShown && !isPending;
      },

      shouldShowBanner: (userId, needsVerification) => {
        if (!needsVerification || !userId) return false;
        const state = get();
        const toastCompleted = state.toastShownForUsers[userId] === true;
        const toastPending = state.toastPendingForUsers[userId] === true;
        const bannerDismissed = useBannerStore.getState().isDismissed(userId);
        return toastCompleted && !toastPending && !bannerDismissed;
      },
    }),
    {
      name: 'quillify-verification',
      partialize: (state) => ({
        // Only persist toastShownForUsers to localStorage
        toastShownForUsers: state.toastShownForUsers,
      }),
    }
  )
);
