FROM oven/bun:1.2.14-slim AS base
WORKDIR /app

# copy the source code
COPY index.ts ./

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]
