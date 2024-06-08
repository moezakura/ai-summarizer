FROM node:20-bookworm AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/summaryer /app/summaryer

RUN apt-get update && apt-get install -y libglib2.0-dev libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2-dev libgtk-3.0 libgbm-dev libasound2



RUN pnpx puppeteer browsers install chrome

EXPOSE 8000
CMD [ "pnpm", "summaryer:start" ]

