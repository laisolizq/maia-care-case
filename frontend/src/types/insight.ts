export interface Insight {
  _id: string;
  userId: string;
  entryIds: string[];
  entriesKey: string;
  summary: string;
  patterns: string[];
  topicsToDiscuss: string[];
  createdAt: string;
  updatedAt: string;
}
