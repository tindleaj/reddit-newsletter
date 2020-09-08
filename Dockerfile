FROM hayd/alpine-deno:1.3.3

EXPOSE 1337

VOLUME /data

ADD . .
RUN deno cache app/main.ts

CMD ["run", "--allow-net", "--allow-write", "--allow-read", "--unstable", "app/main.ts"]