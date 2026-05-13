import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App.js';

describe('<App/>', () => {
  it('renders title heading on any route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Voting System' })).toBeTruthy();
  });

  it('routes "/" to CreatePoll form', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByPlaceholderText(/标题/)).toBeTruthy());
  });
});
