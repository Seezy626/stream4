import { StateCreator } from 'zustand';
import { AppState, UIState, UIActions, Notification } from '../types';

export interface UISlice extends UIState, UIActions {}

export const uiSlice: StateCreator<
  AppState & UIActions,
  [],
  [],
  UISlice
> = (set, get) => ({
  // Initial UI state
  isLoading: false,
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
  setLoading: (isLoading, message = null) => {
    set({
      isLoading,
      loadingMessage: message,
    });
  },

  openModal: (modalId, data = null) => {
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

  closeModal: (modalId) => {
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

  addNotification: (notification) => {
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
          (n) => n.id !== newNotification.id
        );
        set({ notifications: updatedNotifications });
      }, notification.duration);
    }
  },

  removeNotification: (id) => {
    const currentNotifications = get().notifications;
    set({
      notifications: currentNotifications.filter((n) => n.id !== id),
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setSearchQuery: (query) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        query,
      },
    });
  },

  setSearchActive: (isActive) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        isActive,
      },
    });
  },

  setSearchResults: (results) => {
    const currentSearch = get().search;
    set({
      search: {
        ...currentSearch,
        results,
      },
    });
  },

  setTheme: (theme) => {
    set({ theme });
  },
});