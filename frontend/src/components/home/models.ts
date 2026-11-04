import { BotMessageSquare, type LucideIcon, Sparkle } from "lucide-react";
import type { ModelId } from "@/types";

export const MODELS: { id: ModelId; label: string; icon: LucideIcon }[] = [
  { id: "openai", label: "OpenAI", icon: BotMessageSquare },
  { id: "gemini", label: "Gemini", icon: Sparkle },
];
