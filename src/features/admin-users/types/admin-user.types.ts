export type AdminUserActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "error" | "idle" | "success";
};

export const initialAdminUserActionState: AdminUserActionState = {
  status: "idle",
};

export type AdminUserListItem = {
  createdAt: string;
  email: string;
  id: string;
  lastLoginAt: string | null;
  name: string;
  status: string;
};
