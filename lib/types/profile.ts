export type AppRole = "admin" | "client";

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  role: AppRole;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
};
