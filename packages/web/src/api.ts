export interface CreatePollInput {
  title: string;
  options: string[];
  mode: "single" | "multi";
  deadline?: string | null;
}

export interface CreatePollResponse {
  id: number;
  shortCode: string;
  shareUrl: string;
}

export interface PollOption {
  id: number;
  label: string;
  idx: number;
}

export interface ResultEntry {
  optionId: number;
  label: string;
  count: number;
  percent: number;
}

export interface PollDetail {
  shortCode: string;
  title: string;
  mode: "single" | "multi";
  deadlineAt: string | null;
  options: PollOption[];
  totalVotes: number;
  results: ResultEntry[];
}

export interface VoteResponse {
  totalVotes: number;
  results: ResultEntry[];
}

export interface ApiError {
  error: string;
  field?: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let err: ApiError = { error: "request_failed" };
    try {
      err = (await res.json()) as ApiError;
    } catch {}
    throw Object.assign(new Error(err.error), { status: res.status, ...err });
  }
  return (await res.json()) as T;
}

export async function createPoll(
  input: CreatePollInput,
): Promise<CreatePollResponse> {
  const res = await fetch("/api/polls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<CreatePollResponse>(res);
}

export async function getPoll(shortCode: string): Promise<PollDetail> {
  const res = await fetch(`/api/polls/${shortCode}`);
  return handle<PollDetail>(res);
}

export async function vote(
  shortCode: string,
  optionIds: number[],
): Promise<VoteResponse> {
  const res = await fetch(`/api/polls/${shortCode}/vote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ optionIds }),
  });
  return handle<VoteResponse>(res);
}
