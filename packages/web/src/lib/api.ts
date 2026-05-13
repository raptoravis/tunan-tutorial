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

export type ApiError = {
  error: string;
  field?: string;
};

export async function createRoom(input: CreateRoomRequest): Promise<CreateRoomResponse> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.error || '创建失败');
  }
  return (await res.json()) as CreateRoomResponse;
}
