"use client";

import { useParams } from "next/navigation";
import { PlayerGame } from "@/components/player/PlayerGame";

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  return <PlayerGame code={code} />;
}
