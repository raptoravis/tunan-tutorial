import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App.js';

describe('<App/>', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and shows API: ok when /api/health succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
      }),
    );
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Voting System' })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('API: ok')).toBeTruthy());
  });

  it('shows API: error when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    render(<App />);
    await waitFor(() => expect(screen.getByText('API: error')).toBeTruthy());
  });
});
