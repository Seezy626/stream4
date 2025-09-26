import { UIState, UIActions, Notification } from '../types';

export interface UISlice extends UIState, UIActions {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uiSlice = (set: any, get: any) => ({
  // Initial UI state
  uiIsLoading: false,
  loadingMessage: null,
  modals: {},
  notifications: [],
  search: {
    query: '',
    isActive: false,
    results: [],
  },
  theme: 'system',

  // UI actions
  setUILoading: (isLoading: boolean, message?: string) => {
    set({
      uiIsLoading: isLoading,
      loadingMessage: message,
    });
  },

  openModal: (modalId: string, data?: unknown) => {
    const currentModals = get().modals;
    set({
      modals: {
        ...currentModals,
        [modalId]: {
          isOpen: true,
          data,
        },
      },
    });
  },

  closeModal: (modalId: string) => {
    const currentModals = get().modals;
    set({
      modals: {
        ...currentModals,
        [modalId]: {
          isOpen: false,
          data: null,
        },
      },
    });
  },

  closeAllModals: () => {
    set({ modals: {} });
  },

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const currentNotifications = get().notifications;
    set({
      notifications: [...currentNotifications, newNotification],
    });

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        const updatedNotifications = get().notifications.filter(
          (n: Notification) => n.id !== newNotification.id
        );
        set({ notifications: updatedNotifications });
      }, notification.duration);
    }
  },

  removeNotification: (id: string) => {
    const currentNotifications = get().notifications;
    set({
      notifications: currentNotifications.filter((n: Notification) => n.id !== id),
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setSearchQuery: (query: string) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        query,
      },
    });
  },

  setSearchActive: (isActive: boolean) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        isActive,
      },
    });
  },

  setUISearchResults: (results: unknown[]) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        results,
      },
    });
  },

  setTheme: (theme: UIState['theme']) => {
    set({ theme });
  },
});