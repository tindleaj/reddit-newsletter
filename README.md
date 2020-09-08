# README

`reddit-newsletter` is a service that manages and sends relevant reddit posts to users based on a customizable schedule.

## Quick start

To run the `reddit-newsletter` app, you'll either need [Deno](https://deno.land/) or Docker installed.

### Docker

You can run the app in a Docker container by:

- First building the image: `docker build -t reddit-newsletter .`
- Then running the image in interactive mode with port mapping: `docker run -it --init -p 1337:1337 reddit-newsletter`

### Deno

If you have [Deno](https://deno.land/) installed, you can run the server with the command `deno run --allow-net --allow-read --allow-write --unstable app/main.ts`.

## Overview

The `reddit-newsletter` service manages users and sends a newsletter payload based on each users' Reddit preferences and a specified send time. This service exposes a REST API for its functionality.

The service optionally uses docker, allowing for easy deployment on a variety of hosts.

### REST API

- `POST /user`: Creates a new user. Accepts a JSON `body` with the `email` and `name` required properties, ex: `{"email": "jane.doe@mail.com", "name": "Jane Doe"}`. Returns the newly created user `id`.

- `GET /user/:id`: Returns user information for the given user `id`.
- `PATCH /user/:id`: Updates supplied user information for the given `id`. Accepts a `body` with the `name`, `email`, `sendtime`, or `active` properties, ex: `{"active": 0, "sendtime": "08:45"}`.
  - The `active` property can be either `1` (active) or `0` (inactive). An inactive user will not recieve newsletters
  - The `sendtime` property determines when a user will recieve thier newsletter. It must be a string with the form `"HH:MM"`. The default value is `08:00`. All times are in UTC.
- `POST /user/:id/sub/:name`: Adds a new favorite subreddit `name` to the user with the given `id`
- `DELETE /user/:id/sub/:name`: Deletes a favorited subreddit `name` from the user with the given `id`

### Architecture

`reddit-newsletter` is separated into 4 main parts:

1. The REST API server ([main.ts](app/main.ts), [services.ts](app/services.ts)): this part of the app uses the `oak` framework, which is a simple web application framework for Deno, similar to `koa` or `express`. It manages the REST resources by registering the routes and pulling in services that modify the database.
2. The SQLITE3 Database ([db.ts](app/db.ts)): `reddit-newsletter` uses an embedded SQLITE database to persist user preferences. This database actually runs as a WebAssembly executable (via the Deno `sqlite` library), using Deno's WebAssembly runtime. This allows the app to be portable, since the database runs within the main Deno runtime. The database persists to a flatfile called `data/app.db` by default
3. The Dispatch/Poll Worker ([dispatcher.ts](app/dispatcher.ts)): In order to determine when newsletters should be sent out, a poll/dispatch function runs in a separate thread via the Web Workers API. This allows for the REST API to remain unblocked and unblocking. Note: the poll function naively checks every user in the database at a set interval to determine when to send a newsletter payload. This is fine for a small (~1000 user) internal tool, but would have issues at greater scale.
4. The Sender Worker ([sender.ts](app/sender.ts)): The Dispatch/Poll Worker dispatches a message containing the relevant user info to the Sender Worker when a user's sendtime preference matches the current time. The Sender Worker asynchronously fetches the necessary Reddit post info from the Reddit API and sends the payload to the newsletter service (stdout). The Sender Worker exists on its own thread, keeping it independent of the dispatcher thread and the main REST API thread.

## Example newsletter payload output

```json
{
  "title": "Reddit Newsletter",
  "message": "Hello Austin Tindle,\nSee top voted posts from your favorite channels.",
  "sections": [
    {
      "name": "funny",
      "url": "https://reddit.com/r/funny/top",
      "posts": [
        {
          "votes": 60508,
          "title": "When a book doesn't immediately tell you what a character looks like",
          "url": "https://i.redd.it/a2k279ykypl51.png",
          "imageUrl": "https://b.thumbs.redditmedia.com/K2lVOeSo89I8VtXie6tIL03vZeiuLiXDgNtnKybvjAg.jpg"
        },
        {
          "votes": 58071,
          "title": "I made this at work, nobody got it. I thought it was genius.",
          "url": "https://i.redd.it/ljd3zpatbrl51.jpg",
          "imageUrl": "https://a.thumbs.redditmedia.com/N1Dp76KGdPLeXcj4_6nZ2Kp3odUA63KW-VY5FgoC0y8.jpg"
        },
        {
          "votes": 33279,
          "title": "Wife thought I was taking a picture 😂",
          "url": "https://v.redd.it/b52zvyc20ql51",
          "imageUrl": "https://b.thumbs.redditmedia.com/07c5N1dC7gnuwpRZWKf2hbXEx0PwdYOgVKuWEhbW1VM.jpg"
        }
      ]
    },
    {
      "name": "worldnews",
      "url": "https://reddit.com/r/worldnews/top",
      "posts": [
        {
          "votes": 110528,
          "title": "Unidentified masked men snatched the leading Belarusian opposition figure, Maria Kolesnikova, from the street in the centre of the capital, Minsk, on Monday and drove her away in a minivan, witnesses told local media.",
          "url": "https://www.theguardian.com/world/2020/sep/07/belarus-opposition-leader-maria-kolesnikova-snatched-from-street-in-minsk-reports",
          "imageUrl": ""
        },
        {
          "votes": 31437,
          "title": "Jamal Khashoggi murder: Saudi court overturns five death sentences",
          "url": "https://www.theguardian.com/world/2020/sep/07/jamal-khashoggi-saudi-court-overturns-five-death-sentences",
          "imageUrl": ""
        },
        {
          "votes": 17712,
          "title": "Saudi Prince Mohammed bin Salman spent millions turning Trump into his ‘lapdog’: book excerpt",
          "url": "https://www.rawstory.com/2020/08/saudi-prince-mohammed-bin-salman-spent-millions-turning-trump-into-his-lapdog-book-excerpt/",
          "imageUrl": ""
        }
      ]
    },
    {
      "name": "rust",
      "url": "https://reddit.com/r/rust/top",
      "posts": [
        {
          "votes": 275,
          "title": "How to speed up the Rust compiler one last time",
          "url": "https://blog.mozilla.org/nnethercote/2020/09/08/how-to-speed-up-the-rust-compiler-one-last-time/",
          "imageUrl": ""
        },
        {
          "votes": 189,
          "title": "legion v0.3 released and now part of the Amethyst organization",
          "url": "https://amethyst.rs/posts/legion-ecs-v0.3",
          "imageUrl": ""
        },
        {
          "votes": 167,
          "title": "I Made A Rust Quine",
          "url": "https://www.reddit.com/r/rust/comments/iocgex/i_made_a_rust_quine/",
          "imageUrl": ""
        }
      ]
    }
  ]
}
```
