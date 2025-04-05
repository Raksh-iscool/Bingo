import Link from "next/link";

import { HydrateClient } from "@/trpc/server";
import Landing from "./landing/page";


export default async function Home() {
  return (
    <HydrateClient>
      <Landing />
    </HydrateClient>
  );
}
