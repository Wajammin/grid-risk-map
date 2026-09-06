import { createFileRoute } from "@tanstack/react-router";
import { IntroReel } from "@/components/intro-reel";

export const Route = createFileRoute("/")({ component: Intro });

function Intro() {
  return <IntroReel />;
}
