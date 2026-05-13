export type PollMode = "single" | "multi";

export interface Poll {
  id: number;
  shortCode: string;
  title: string;
  mode: PollMode;
  createdAt: string;
}

export interface PollOption {
  id: number;
  label: string;
  idx: number;
}

export interface PollDetail {
  shortCode: string;
  title: string;
  mode: PollMode;
  options: PollOption[];
  totalVotes: number;
  results: { optionId: number; label: string; count: number; percent: number }[];
}
