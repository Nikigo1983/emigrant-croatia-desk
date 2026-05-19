import { LogoutButton } from "@/components/logout-button";

export function DashboardFooter() {
  return (
    <div className="border-t border-[var(--input-border)] pt-6">
      <LogoutButton />
    </div>
  );
}
