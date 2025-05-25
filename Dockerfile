FROM oven/bun:alpine
WORKDIR /app

# copy the source code
COPY index.ts utils.ts ./

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]
