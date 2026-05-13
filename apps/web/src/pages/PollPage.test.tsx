import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PollPage } from './PollPage.js';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

function pollResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      id: 'pid1234567',
      title: '中饭吃啥',
      deadline_at: null,
      options: [
        { id: 'opt-a', label: 'A', position: 0 },
        { id: 'opt-b', label: 'B', position: 1 },
      ],
      is_owner: false,
      your_option_id: null,
      closed: false,
      tallies: [
        { option_id: 'opt-a', count: 0, percent: 0 },
        { option_id: 'opt-b', count: 0, percent: 0 },
      ],
      total_votes: 0,
      ...overrides,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('PollPage', () => {
  it('T-WV1 renders radio list', async () => {
    fetchMock.mockResolvedValueOnce(pollResponse());
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    expect(screen.getByLabelText('vote-opt-a')).toBeInTheDocument();
    expect(screen.getByLabelText('vote-opt-b')).toBeInTheDocument();
  });

  it('T-WV2 submit without selection → error, no second fetch', async () => {
    fetchMock.mockResolvedValueOnce(pollResponse());
    const user = userEvent.setup();
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    await user.click(screen.getByRole('button', { name: /提交投票/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/请选择/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('T-WV3 selecting and submitting calls POST /votes', async () => {
    fetchMock
      .mockResolvedValueOnce(pollResponse())
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      .mockResolvedValueOnce(pollResponse({ your_option_id: 'opt-a' }));
    const user = userEvent.setup();
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    await user.click(screen.getByLabelText('vote-opt-a'));
    await user.click(screen.getByRole('button', { name: /提交投票/ }));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find((c) =>
        typeof c[1] === 'object' && (c[1] as RequestInit).method === 'POST',
      );
      expect(post).toBeDefined();
      expect(String(post?.[0])).toContain('/votes');
    });
  });

  it('T-WV4 your_option_id pre-selects radio', async () => {
    fetchMock.mockResolvedValueOnce(pollResponse({ your_option_id: 'opt-b' }));
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    expect(screen.getByLabelText('vote-opt-b')).toBeChecked();
    expect(screen.getByLabelText('vote-opt-a')).not.toBeChecked();
    expect(screen.getByLabelText('your-choice')).toBeInTheDocument();
  });

  it('T-WR1 renders counts and percent per option', async () => {
    fetchMock.mockResolvedValueOnce(
      pollResponse({
        total_votes: 3,
        tallies: [
          { option_id: 'opt-a', count: 2, percent: 66.7 },
          { option_id: 'opt-b', count: 1, percent: 33.3 },
        ],
      }),
    );
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    expect(screen.getByLabelText('tally-opt-a')).toHaveTextContent('2 票');
    expect(screen.getByLabelText('tally-opt-a')).toHaveTextContent('66.7%');
    expect(screen.getByLabelText('tally-opt-b')).toHaveTextContent('1 票');
    expect(screen.getByLabelText('total-votes')).toHaveTextContent('3 票');
  });

  it('T-WR2 total_votes=0 shows 暂无投票', async () => {
    fetchMock.mockResolvedValueOnce(pollResponse({ total_votes: 0 }));
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    expect(screen.getByLabelText('total-votes')).toHaveTextContent('暂无投票');
  });

  it('T-WR3 after self-vote, refresh reflects new tallies', async () => {
    fetchMock
      .mockResolvedValueOnce(pollResponse())
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      .mockResolvedValueOnce(
        pollResponse({
          your_option_id: 'opt-a',
          total_votes: 1,
          tallies: [
            { option_id: 'opt-a', count: 1, percent: 100 },
            { option_id: 'opt-b', count: 0, percent: 0 },
          ],
        }),
      );
    const user = userEvent.setup();
    render(<PollPage id="pid1234567" />);
    await screen.findByText('中饭吃啥');
    await user.click(screen.getByLabelText('vote-opt-a'));
    await user.click(screen.getByRole('button', { name: /提交投票/ }));
    await waitFor(() => {
      expect(screen.getByLabelText('tally-opt-a')).toHaveTextContent('1 票');
    });
  });
});
