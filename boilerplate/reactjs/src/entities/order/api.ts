import { baseApi } from '../../features/api/baseApi';
import type {
  OrderListItem,
  OrderDetail,
  PaginatedResult,
  UpdateOrderStatusCommand,
  CreateOrderCommand,
  OrderResult,
  OrderStateLiteral,
} from './types';

export type SortDirection = 'ASC' | 'DESC';

export interface ListOrdersParams {
  page?: number;
  size?: number;
  status?: OrderStateLiteral;
  sort?: string;
  direction?: SortDirection;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrders: builder.query<
      PaginatedResult<OrderListItem>,
      ListOrdersParams
    >({
      query: ({ page = 0, size = 20, status, sort, direction }) => {
        const params: Record<string, string | number> = { page, size };
        if (status) params.status = status;
        if (sort) {
          params.sort = sort;
          params.direction = direction ?? 'DESC';
        }
        return { url: '/orders', method: 'GET', params };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ orderId }) => ({ type: 'Order' as const, id: orderId })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    getOrder: builder.query<OrderDetail, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    createOrder: builder.mutation<OrderResult, CreateOrderCommand>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    updateOrderStatus: builder.mutation<
      void,
      { id: string; command: UpdateOrderStatusCommand }
    >({
      query: ({ id, command }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: command,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Order', id }],
    }),

    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} = ordersApi;
