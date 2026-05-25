import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Order } from '@src/types/Order';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  // Order-related state
  orders: Order[];
  selectedOrder: Order | null;
  isOrderModalOpen: boolean;

  // Navigation state
  currentRoute: string;

  // User state
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  setSelectedOrder: (order: Order | null) => void;
  toggleOrderModal: () => void;
  setOrderModalOpen: (isOpen: boolean) => void;

  setCurrentRoute: (route: string) => void;

  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
}

const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // State
        orders: [],
        selectedOrder: null,
        isOrderModalOpen: false,
        currentRoute: '/orders',
        user: null,
        isAuthenticated: false,

        // Order Actions
        setOrders: (orders) => set({ orders }),
        addOrder: (order) =>
          set((state) => ({ orders: [...state.orders, order] })),
        updateOrder: (order) =>
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === order.id ? order : o,
            ),
            selectedOrder:
              state.selectedOrder?.id === order.id ? order : state.selectedOrder,
          })),
        removeOrder: (orderId) =>
          set((state) => ({
            orders: state.orders.filter((o) => o.id !== orderId),
            selectedOrder:
              state.selectedOrder?.id === orderId ? null : state.selectedOrder,
          })),
        setSelectedOrder: (order) => set({ selectedOrder: order }),
        toggleOrderModal: () =>
          set((state) => ({
            isOrderModalOpen: !state.isOrderModalOpen,
          })),
        setOrderModalOpen: (isOpen) => set({ isOrderModalOpen: isOpen }),

        // Navigation Actions
        setCurrentRoute: (route) => set({ currentRoute: route }),

        // User Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        login: (user) => set({ user, isAuthenticated: true }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      {
        name: 'example-app-storage',
        partialize: (state) => ({
          orders: state.orders,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
  ),
);

export default useStore;
