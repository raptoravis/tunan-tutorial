import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CreatePoll } from './CreatePoll.js';

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<CreatePoll/>', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders 2 option inputs initially and create button is disabled when title empty', () => {
    renderWithRouter();
    expect(screen.getAllByPlaceholderText(/选项/).length).toBe(2);
    const btn = screen.getByRole('button', { name: /创建/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('adds option rows up to 20', () => {
    renderWithRouter();
    const addBtn = screen.getByRole('button', { name: /加选项|添加选项|加/ });
    for (let i = 0; i < 18; i++) fireEvent.click(addBtn);
    expect(screen.getAllByPlaceholderText(/选项/).length).toBe(20);
    expect((addBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('submits to /api/polls and navigates to /poll/:id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 201,
        ok: true,
        json: async () => ({ id: 'abcd1234', url: '/poll/abcd1234' }),
      }),
    );
    renderWithRouter();
    fireEvent.change(screen.getByPlaceholderText(/标题/), { target: { value: '中午吃啥' } });
    const opts = screen.getAllByPlaceholderText(/选项/);
    fireEvent.change(opts[0], { target: { value: '麻辣烫' } });
    fireEvent.change(opts[1], { target: { value: '盖饭' } });
    fireEvent.click(screen.getByRole('button', { name: /创建/ }));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('/poll/abcd1234'));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/polls',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
