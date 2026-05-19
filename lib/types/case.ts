export type CaseRecord = {
  id: string;
  client_id: string;
  current_stage: string | null;
  current_status: string | null;
  status_updated_at: string;
  submission_date: string | null;
  submission_city: string | null;
  case_number: string | null;
  consulate: string | null;
  internal_comment: string | null;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
};
