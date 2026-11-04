import { DEMO_MODE } from "@/backend";

export default function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div
      role="note"
      className="w-screen bg-primary px-4 py-1 text-center text-sm text-background"
    >
      Demo mode: canned output, not for clinical use
    </div>
  );
}
