import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PollPage } from './PollPage.js';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<PollPage/>', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders loading initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    renderAt('/poll/abc12345');
    expect(screen.getByText(/加载中|loading/i)).toBeTruthy();
  });

  it('renders title + options when fetch succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'abc12345',
          title: '中午吃啥',
          options: [
            { id: 'o1', text: '麻辣烫', count: 0 },
            { id: 'o2', text: '盖饭', count: 0 },
          ],
          totalVotes: 0,
        }),
      }),
    );
    renderAt('/poll/abc12345');
    await waitFor(() => expect(screen.getByText('中午吃啥')).toBeTruthy());
    expect(screen.getByText('麻辣烫')).toBeTruthy();
    expect(screen.getByText('盖饭')).toBeTruthy();
  });

  it('shows not-found message on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not found' }),
      }),
    );
    renderAt('/poll/zzzzzzzz');
    await waitFor(() => expect(screen.getByText(/找不到这个投票/)).toBeTruthy());
  });
});
