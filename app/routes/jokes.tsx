import type { Joke } from "@prisma/client";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { Outlet, Link, useLoaderData } from "@remix-run/react";
import stylesUrl from "~/styles/jokes.css";
import { db } from "~/utils/db.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

type LoaderData = { jokes: Array<Pick<Joke, "id" | "name">> };
export const loader: LoaderFunction = async () => {
  const jokes = await db.joke.findMany({
    take: 5,
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });
  const data: LoaderData = { jokes };
  return data;
};

export default function JokesRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokes.map((el) => (
                <li key={el.id}>
                  <Link to={el.id}>{el.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
