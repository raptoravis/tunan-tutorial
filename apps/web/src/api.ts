export type CreateVoteRequest = { title: string; options: string[] };
export type CreateVoteResponse = { id: string; admin_token: string };

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
