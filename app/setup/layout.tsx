import AppShell from "@/components/layout/AppShell";

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
