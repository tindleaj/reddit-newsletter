import { RouterContext } from "https://deno.land/x/oak/router.ts";
import { db } from "./db.ts";

const isValidTime = (str: string) => {
  return (str.search(/^\d{2}:\d{2}$/) != -1) &&
    (parseInt(str.substr(0, 2)) >= 0 && parseInt(str.substr(0, 2)) <= 23) &&
    (parseInt(str.substr(3, 2)) >= 0 && parseInt(str.substr(3, 2)) <= 59);
};

export const createUser = async (context: RouterContext) => {
  try {
    const body = await context.request.body({ type: "json" }).value;

    if (body.name && body.email) {
      db.query(
        "INSERT INTO users (name, email, sendtime, active, subreddits) VALUES (?, ?, ?, ?, ?);",
        [body.name, body.email, "08:00", 1, JSON.stringify([])],
      );

      // Return the newly created user's id
      const result = db.query(
        "SELECT id FROM users WHERE (name = ?) AND (email = ?)",
        [body.name, body.email],
      );

      context.response.body = { id: result.next().value[0] };
    }
  } catch (error) {
    console.error(error);
  }
};

export const getUser = async (context: RouterContext) => {
  try {
    if (context.params.id) {
      const userId = context.params.id;

      const results = db.query(
        "SELECT * FROM users WHERE id=(:userId);",
        [userId],
      );

      // db.query returns an Iterable, but there's only one item here
      // so we pull it off with .next()
      const [id, name, email, sendtime, active, subreddits] =
        results.next().value;

      context.response.body = {
        id,
        name,
        email,
        sendtime,
        active,
        subreddits,
      };
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateUser = async (context: RouterContext) => {
  try {
    const userId = context.params.id;
    const body = await context.request.body({ type: "json" }).value;

    if (body.name) {
      db.query(
        "UPDATE users SET name = (?) WHERE id=(:userId);",
        [body.name, userId],
      );
    }

    if (body.email) {
      db.query(
        "UPDATE users SET email = (?) WHERE id=(:userId);",
        [body.email, userId],
      );
    }

    if (body.sendtime && isValidTime(body.sendtime)) {
      db.query(
        "UPDATE users SET sendtime = (?) WHERE id=(:userId);",
        [body.sendtime, userId],
      );
    }

    if (typeof body.active === "number") {
      db.query(
        "UPDATE users SET active = (?) WHERE id=(:userId);",
        [body.active, userId],
      );
    }
  } catch (error) {
    console.error(error);
  }
};

export const addSub = async (context: RouterContext) => {
  try {
    if (context.params.id && context.params.name) {
      const userId = context.params.id;
      const name = context.params.name;

      const results = db.query(
        "SELECT subreddits FROM users WHERE id=(:userId);",
        [userId],
      );

      // db.query returns an Iterable, but there's only one item here
      // so we pull it off with .next()
      const currentSubs: Array<string> = JSON.parse(results.next().value);

      if (!currentSubs.includes(name)) {
        const updatedSubs = JSON.stringify(
          [...currentSubs, name],
        );

        db.query(
          "UPDATE users SET subreddits = (:updatedSubs) WHERE id=(:userId);",
          [updatedSubs, userId],
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const deleteSub = async (context: RouterContext) => {
  try {
    if (context.params.id && context.params.name) {
      const userId = context.params.id;
      const name = context.params.name;

      const results = db.query(
        "SELECT subreddits FROM users WHERE id=(:userId);",
        [userId],
      );

      // db.query returns an Iterable, but there's only one item here
      // so we pull it off with .next()
      const currentSubs: Array<string> = JSON.parse(results.next().value);

      if (currentSubs.includes(name)) {
        const updatedSubs = JSON.stringify(
          currentSubs.filter((item) => item !== name),
        );

        db.query(
          "UPDATE users SET subreddits = (:updatedSubs) WHERE id=(:userId);",
          [updatedSubs, userId],
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
};
