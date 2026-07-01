import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrderStateLiteral } from 'entities/order/types';

export interface OrdersFilter {
  status: OrderStateLiteral | null;
}

export interface OrdersState {
  page: number;
  size: number;
  sort: string | null;
  direction: 'ASC' | 'DESC';
  filter: OrdersFilter;
}

const initialState: OrdersState = {
  page: 0,
  size: 10,
  sort: null,
  direction: 'DESC',
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
    setSort: (state, action: PayloadAction<{ sort: string | null; direction: 'ASC' | 'DESC' }>) => {
      state.sort = action.payload.sort;
      state.direction = action.payload.direction;
    },
    resetFilters: state => {
      state.page = 0;
      state.sort = null;
      state.direction = 'DESC';
      state.filter = { status: null };
    },
  },
});

export const { setPage, setSize, setFilterStatus, setSort, resetFilters } = ordersSlice.actions;
export default ordersSlice.reducer;
