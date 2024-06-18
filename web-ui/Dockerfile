FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app/web-ui

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
RUN pwd
RUN pnpm install --frozen-lockfile
RUN cd ../ && pnpm install --frozen-lockfile
RUN pnpm build

FROM base
COPY --from=build /app/web-ui/node_modules /app/node_modules
COPY --from=build /app/web-ui/package.json /app/package.json
COPY --from=build /app/web-ui/build /app/build

# PORT
ENV PORT="5173"
EXPOSE $PORT

CMD [ "pnpm", "start" ]

