import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPage, setFilterStatus, setSort, resetFilters } from './ordersSlice';
import { useListOrdersQuery, useDeleteOrderMutation } from 'entities/order/api';
import type { RootState } from 'app/store';
import type { OrderStateLiteral } from 'entities/order/types';

export interface UseOrdersReturn {
  page: number;
  size: number;
  sort: string | null;
  direction: 'ASC' | 'DESC';
  filter: { status: OrderStateLiteral | null };
  data: any | undefined;
  isLoading: boolean;
  error: unknown;
  isDeleting: boolean;
  handlePageChange: (newPage: number) => void;
  handleSort: (columnKey: string) => void;
  handleFilterStatus: (status: OrderStateLiteral | null) => void;
  handleResetFilters: () => void;
  handleDelete: (id: string) => Promise<void>;
  handleRefresh: () => void;
  renderSortIndicator: (columnKey: string) => React.ReactNode;
  isSortActive: (columnKey: string) => boolean;
}

function nextDirection(current: 'ASC' | 'DESC' | null): 'ASC' | 'DESC' | null {
  if (current === null) return 'ASC';
  if (current === 'ASC') return 'DESC';
  return null;
}

export function useOrders(): UseOrdersReturn {
  const dispatch = useDispatch();
  const { page, size, sort, direction, filter } = useSelector((state: RootState) => state.orders);

  const { data, isLoading, error, refetch } = useListOrdersQuery({
    page,
    size,
    status: filter.status || undefined,
    sort: sort || undefined,
    direction: sort ? direction : undefined,
  });

  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 0 && data && newPage < data.totalPages) {
        dispatch(setPage(newPage));
      }
    },
    [data, dispatch]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      const currentDir = sort === columnKey ? direction : null;
      const nextDir = nextDirection(currentDir);
      dispatch(
        setSort({
          sort: nextDir ? columnKey : null,
          direction: nextDir ?? 'DESC',
        })
      );
    },
    [sort, direction, dispatch]
  );

  const handleFilterStatus = useCallback(
    (status: OrderStateLiteral | null) => {
      dispatch(setFilterStatus(status));
    },
    [dispatch]
  );

  const handleResetFilters = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Are you sure? This will soft-delete the order.')) return;
      try {
        await deleteOrder(id).unwrap();
      } finally {
        // State update handled by RTK Query isDeleting flag
      }
    },
    [deleteOrder]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderSortIndicator = useCallback(
    (columnKey: string) => {
      if (sort !== columnKey) {
        return <span className="ml-1 text-gray-300 select-none">⇅</span>;
      }
      return (
        <span className="ml-1 text-brand-600 select-none">{direction === 'ASC' ? '▲' : '▼'}</span>
      );
    },
    [sort, direction]
  );

  const isSortActive = useCallback((columnKey: string) => sort === columnKey, [sort]);

  return {
    page,
    size,
    sort,
    direction,
    filter,
    data,
    isLoading,
    error,
    isDeleting,
    handlePageChange,
    handleSort,
    handleFilterStatus,
    handleResetFilters,
    handleDelete,
    handleRefresh,
    renderSortIndicator,
    isSortActive,
  };
}
