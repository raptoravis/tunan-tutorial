export type CreateVoteRequest = { title: string; options: string[] };
export type CreateVoteResponse = { id: string; admin_token: string };

export type VoteOption = { idx: number; label: string; count: number };
export type VoteDetail = {
  id: string;
  title: string;
  options: VoteOption[];
  closed: boolean;
  you_voted_idx: number | null;
};

export async function createVote(req: CreateVoteRequest): Promise<CreateVoteResponse> {
  const res = await fetch('/api/votes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `http_${res.status}`);
  }
  return (await res.json()) as CreateVoteResponse;
}

export async function getVote(id: string): Promise<VoteDetail> {
  const res = await fetch(`/api/votes/${id}`, { credentials: 'same-origin' });
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json()) as VoteDetail;
}
