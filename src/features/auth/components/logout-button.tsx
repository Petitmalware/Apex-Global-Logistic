"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { secureFetch } from "@/lib/security/client-fetch";

export function LogoutButton() {
  async function handleLogout() {
    await secureFetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.assign("/login");
  }

  return (
    <Button onClick={handleLogout} type="button" variant="outline">
      <LogOut aria-hidden="true" />
      Sign out
    </Button>
  );
}
