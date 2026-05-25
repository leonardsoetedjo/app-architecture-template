import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderForm from './OrderForm';

describe('OrderForm', () => {
  it('renders form elements', () => {
    render(<OrderForm />);
    expect(screen.getByText(/create new order/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create order/i })).toBeInTheDocument();
  });
});
