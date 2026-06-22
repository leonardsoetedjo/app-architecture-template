import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@tests/mocks/server';
import authReducer from 'features/auth/authSlice';
import ordersReducer from 'features/orders/ordersSlice';
import { baseApi } from 'features/api/baseApi';
import OrdersPage from 'pages/OrdersPage';

function renderWithProviders(ui: React.ReactNode, preloadedState = {}) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      orders: ordersReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: { id: 'u1', email: 'test@example.com', roles: ['USER'], enabled: true },
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
        isInitialized: true,
      },
      orders: {
        page: 0,
        size: 20,
        sort: null,
        direction: 'DESC' as const,
        filter: { status: null },
      },
      ...preloadedState,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>,
    ),
  };
}

describe('OrdersPage', () => {
  it('renders table headers including sortable columns', () => {
    renderWithProviders(<OrdersPage />);

    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('+ New Order')).toBeInTheDocument();
  });

  it('loads and displays orders', async () => {
    renderWithProviders(<OrdersPage />);

    // Wait for data load to finish (loading indicator disappears)
    await waitFor(() => {
      expect(screen.queryByText('Loading orders…')).not.toBeInTheDocument();
    });

    // Verify data from mock - use getAllByText since status names appear in both table and dropdown
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Shipped').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Delivered').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no orders', async () => {
    server.use(
      http.get('/api/v1/orders', () => {
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        });
      }),
    );

    renderWithProviders(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders found.')).toBeInTheDocument();
    });
  });

  it('shows error state with retry', async () => {
    server.use(
      http.get('/api/v1/orders', () => {
        return new HttpResponse(
          JSON.stringify({ message: 'Internal server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );

    renderWithProviders(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    renderWithProviders(<OrdersPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading orders…')).not.toBeInTheDocument();
    });

    // Select status filter using combobox role
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'PENDING' } });

    // After filter, table should still show the PENDING order row
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // At least header + 1 data row
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('sorts by column on click', async () => {
    renderWithProviders(<OrdersPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading orders…')).not.toBeInTheDocument();
    });

    const totalHeader = screen.getByText('Total');

    // Click Total column to sort
    fireEvent.click(totalHeader);

    // After click, sort indicator should show
    await waitFor(() => {
      const header = totalHeader.closest('th');
      expect(header).toHaveClass('text-brand-700');
      expect(header).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  it('disables sort on third click', async () => {
    renderWithProviders(<OrdersPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading orders…')).not.toBeInTheDocument();
    });

    const totalHeader = screen.getByText('Total');

    // First click: ASC
    fireEvent.click(totalHeader);
    // Second click: DESC
    fireEvent.click(totalHeader);
    // Third click: remove sort
    fireEvent.click(totalHeader);

    await waitFor(() => {
      const header = totalHeader.closest('th');
      expect(header).not.toHaveClass('text-brand-700');
      expect(header).toHaveAttribute('aria-sort', 'none');
    });
  });

  it('paginates through orders', async () => {
    // Create more mock data for pagination
    const manyOrders = Array.from({ length: 25 }, (_, i) => ({
      orderId: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      status: i % 2 === 0 ? 'PENDING' : 'CONFIRMED',
      itemCount: 1,
      totalAmount: '10.00',
      createdAt: `2025-01-${String((i % 30) + 1).padStart(2, '0')}T10:00:00Z`,
    }));

    server.use(
      http.get('/api/v1/orders', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '0');
        const size = 20;
        const start = page * size;
        const content = manyOrders.slice(start, start + size);

        return HttpResponse.json({
          content,
          page,
          size,
          totalElements: manyOrders.length,
          totalPages: Math.ceil(manyOrders.length / size),
        });
      }),
    );

    renderWithProviders(<OrdersPage />);

    // Wait for data and pagination
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    // Next page button should be enabled
    const nextBtn = screen.getByText('Next');
    expect(nextBtn).not.toBeDisabled();

    // Go to page 2
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    // Previous should be enabled, Next disabled
    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });
});
