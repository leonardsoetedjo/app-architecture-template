import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../features/api/baseApi';
import authReducer from '../features/auth/authSlice';
import ordersReducer from '../features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
