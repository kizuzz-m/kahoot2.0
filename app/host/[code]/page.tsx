"use client";

import { useParams } from "next/navigation";
import { HostGame } from "@/components/host/HostGame";

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  return <HostGame code={code} />;
}
