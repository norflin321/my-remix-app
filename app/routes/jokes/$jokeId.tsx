import type { Joke } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";

type LoaderData = { joke: Joke | null };
export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({ where: { id: params.jokeId } });
  if (!joke) throw new Error("Joke not found");
  const data: LoaderData = { joke };
  return data;
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke?.content}</p>
    </div>
  );
}
