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

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listOrders: builder.query<
      PaginatedResult<OrderListItem>,
      { page?: number; size?: number; status?: OrderStateLiteral }
    >({
      query: ({ page = 0, size = 20, status }) => ({
        url: '/orders',
        method: 'GET',
        params: status ? { page, size, status } : { page, size },
      }),
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
