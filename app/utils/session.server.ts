import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "./db.server";

type LoginType = {
  username: string;
  password: string;
};

export const register = async ({ username, password }: LoginType) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { username, passwordHash } });
  return user;
};

export const login = async ({ username, password }: LoginType) => {
  const userExists = await db.user.findFirst({ where: { username } });
  if (!userExists) return null;

  const passwordMatch = await bcrypt.compare(password, userExists.passwordHash);
  if (!passwordMatch) return null;

  return userExists;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("Must set environment variable SESSION_SECRET");
}

const storage = createCookieSessionStorage({
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    name: "remix-jokes-session",
    secrets: [],
  },
});

export const createUserSession = async (userId: string, redirectTo: string) => {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
};

const getUserSession = async (request: Request) => {
  return storage.getSession(request.headers.get("Cookie"));
};

export const getUserId = async (request: Request) => {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (typeof userId !== "string") return null;
  return userId;
};

export const requireUserId = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) => {
  const userId = await getUserId(request);
  if (!userId) {
    const params = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${params}`);
  }
  return userId;
};

export const getUser = async (request: Request) => {
  const userId = await getUserId(request);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
};

export const logout = async (request: Request) => {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
};
