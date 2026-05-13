export type CreateRoomRequest = {
  title: string;
  options: string[];
  allow_add: boolean;
};

export type CreateRoomResponse = {
  room_id: string;
  admin_token: string;
  url: string;
};

export type RoomOption = {
  id: number;
  label: string;
};

export type Room = {
  id: string;
  title: string;
  allow_add: boolean;
  created_at: string;
  closed_at: string | null;
  options: RoomOption[];
};

export type ApiError = {
  error: string;
  field?: string;
};

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let err: ApiError = { error: `HTTP ${res.status}` };
    try {
      err = (await res.json()) as ApiError;
    } catch {
      /* ignore */
    }
    const e = new Error(err.error || `HTTP ${res.status}`);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  return (await res.json()) as T;
}

export async function createRoom(input: CreateRoomRequest): Promise<CreateRoomResponse> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow<CreateRoomResponse>(res);
}

export async function fetchRoom(roomId: string): Promise<Room> {
  const res = await fetch(`/api/rooms/${roomId}`, { credentials: 'include' });
  return jsonOrThrow<Room>(res);
}

export async function fetchMyVote(roomId: string): Promise<{ selected: number[] }> {
  const res = await fetch(`/api/rooms/${roomId}/my-vote`, { credentials: 'include' });
  return jsonOrThrow<{ selected: number[] }>(res);
}

export async function submitVote(
  roomId: string,
  optionIds: number[],
): Promise<{ ok: true; selected: number[] }> {
  const res = await fetch(`/api/rooms/${roomId}/votes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ option_ids: optionIds }),
  });
  return jsonOrThrow<{ ok: true; selected: number[] }>(res);
}

export type Results = {
  total_participants: number;
  options: { id: number; label: string; votes: number }[];
};

export async function fetchResults(roomId: string): Promise<Results> {
  const res = await fetch(`/api/rooms/${roomId}/results`, { credentials: 'include' });
  return jsonOrThrow<Results>(res);
}

export async function addOption(roomId: string, label: string): Promise<{ id: number; label: string }> {
  const res = await fetch(`/api/rooms/${roomId}/options`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  return jsonOrThrow<{ id: number; label: string }>(res);
}
