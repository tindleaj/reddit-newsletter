/**
 * The dispatcher handles polling the database and dispatching a newsletter payload
 * for a particular user if their sendtime preference matches the current time.
 * The dispatcher runs on it's own worker/thread in order to not block any API
 * requests or vice-versa. For a small internal tool on the order of ~1000 users
 * this approach will work fine, but performance and latency of the poll query 
 * would need to be taken into account if this service needed to handle more users.
 */

import { db } from "./db.ts";

const INTERVAL = 60 * 1000; // 1 minute

// Register another worker/thread to handle fetching subreddit posts and sending
// the newsletter payload asynchronously from the main thread or the poll/dispatch
// thread
const sender = new Worker(
  new URL("sender.ts", import.meta.url).href,
  { type: "module", deno: true },
);

const poll = () => {
  const now = new Date();
  const hours = now.getUTCHours().toString();
  const minutes = now.getUTCMinutes().toString();
  const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;

  // See if the current time matches an active user's sendtime
  const users = db.query(
    "SELECT * FROM users WHERE (sendtime = (:formattedTime)) AND (active = 1)",
    [formattedTime],
  );

  for (const user of users) {
    sender.postMessage(user);
  }
};

setInterval(poll, INTERVAL);
