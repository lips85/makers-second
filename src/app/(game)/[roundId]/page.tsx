import { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoundGame } from "@/components/game/RoundGame";
import { Navbar } from "@/components/layout/Navbar";

interface RoundPageProps {
  params: {
    roundId: string;
  };
  searchParams: {
    duration?: string;
  };
}

export const metadata: Metadata = {
  title: "Word Rush - 라운드 플레이",
  description: "영어 단어 스피드 퀴즈 라운드",
  robots: "noindex, nofollow",
};

export default async function RoundPage({
  params,
  searchParams,
}: RoundPageProps) {
  const { roundId } = await params;
  const durationParam = (await searchParams).duration;

  // Validate roundId
  if (!roundId || roundId === "undefined") {
    notFound();
  }

  // Validate and normalize duration
  let duration = 60; // default
  if (durationParam) {
    const parsedDuration = parseInt(durationParam, 10);
    if ([60, 75, 90].includes(parsedDuration)) {
      duration = parsedDuration;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <RoundGame roundId={roundId} duration={duration} />
    </div>
  );
}
