export interface PollOption {
  id: string;
  label: string;
  position: number;
}

export interface Poll {
  id: string;
  title: string;
  deadline_at: string | null;
  options: PollOption[];
  is_owner: boolean;
}

export interface CreatePollInput {
  title: string;
  options: string[];
  deadline_at?: string;
}

export async function createPoll(input: CreatePollInput): Promise<{ id: string }> {
  const res = await fetch('/api/polls', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `create_failed_${res.status}`);
  }
  return res.json();
}

export async function getPoll(id: string): Promise<Poll> {
  const res = await fetch(`/api/polls/${id}`, { credentials: 'same-origin' });
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`get_failed_${res.status}`);
  return res.json();
}
