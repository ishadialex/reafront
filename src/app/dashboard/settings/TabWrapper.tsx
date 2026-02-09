"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const VALID_TABS = ["password", "notifications", "privacy", "sessions", "danger"];

interface TabWrapperProps {
  onTabChange: (tab: string) => void;
}

export function TabWrapper({ onTabChange }: TabWrapperProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "";
  const initialTab = VALID_TABS.includes(tab) ? tab : "password";

  useEffect(() => {
    onTabChange(initialTab);
  }, [initialTab, onTabChange]);

  return null;
}
