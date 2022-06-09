import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";

const validateJokeName = (name: string) => {
  if (name.length < 3) {
    return "Joke name must be at least 3 characters long";
  }
};

const validateJokeContent = (content: string) => {
  if (content.length < 10) {
    return "Joke content must be at least 10 characters long";
  }
};

type ActionData = {
  formError?: string;
  fields?: { name?: string; content?: string };
  fieldErrors?: { name?: string; content?: string };
};
export const action: ActionFunction = async ({
  request,
}): Promise<ActionData | Response> => {
  // check if client send us cookie with his userId, redirect to login if not
  const userId = await requireUserId(request);

  // validate form data
  const form = await request.formData();
  const name = form.get("name");
  const content = form.get("content");
  if (typeof name !== "string" || typeof content !== "string") {
    return { formError: "Form submitted incorrectly" };
  }
  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors, fields: { name, content } };
  }

  // create new joke
  const joke = await db.joke.create({
    data: { name, content, jokesterId: userId },
  });
  return redirect(`/jokes/${joke.id}`);
};

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();
  return (
    <div>
      <p>Add your own hilarious joke</p>
      <form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-errormessage={
                actionData?.fieldErrors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{" "}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          {actionData?.formError ? (
            <p className="form-validation-error" role="alert">
              {actionData.formError}
            </p>
          ) : null}
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
