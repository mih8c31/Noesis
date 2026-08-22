export interface ReadingSession {
  id: string;
  document_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  pages_read: number[];
  progress_pct: number | null;
  last_position: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  session_id: string;
  page_number: number;
  position_pct: number | null;
  label: string | null;
  created_at: string;
}

export interface TocItem {
  title: string;
  pageNumber: number;
  items?: TocItem[];
}
