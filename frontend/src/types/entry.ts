export interface CreateEntry {
  date: string;
  wellbeing: number;
  sleep: number;
  energy: number;
  stress: number;
  symptoms: string[];
  notes?: string;
}

export interface EntryResponse extends CreateEntry {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
