import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrderStateLiteral } from 'entities/order/types';

export interface OrdersFilter {
  status: OrderStateLiteral | null;
}

export interface OrdersState {
  page: number;
  size: number;
  filter: OrdersFilter;
}

const initialState: OrdersState = {
  page: 0,
  size: 20,
  filter: { status: null },
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.size = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<OrderStateLiteral | null>) => {
      state.filter.status = action.payload;
      state.page = 0;
    },
    resetFilters: (state) => {
      state.page = 0;
      state.filter = { status: null };
    },
  },
});

export const { setPage, setSize, setFilterStatus, resetFilters } = ordersSlice.actions;
export default ordersSlice.reducer;
