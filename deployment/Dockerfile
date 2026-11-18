FROM node:24-bookworm-slim AS web
WORKDIR /build
COPY package.json package-lock.json ./
RUN npx --yes --package=npm@10.9.4 -- npm ci --ignore-scripts
COPY . .
ARG SOURCE_REVISION
RUN VITE_SCOREMAP_BUILD=$SOURCE_REVISION npm run build:private

FROM mcr.microsoft.com/dotnet/sdk:10.0.103 AS backend
WORKDIR /build
COPY . .
RUN dotnet restore ScoreMap.slnx --locked-mode
ARG SOURCE_REVISION
RUN dotnet publish src/root/ScoreMap.Api -c Release --no-restore -p:SourceRevisionId=$SOURCE_REVISION -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0.15
WORKDIR /app
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision=$SOURCE_REVISION
COPY --from=backend /out ./
COPY --from=web /build/dist-private ./wwwroot
ENV ASPNETCORE_ENVIRONMENT=Production ASPNETCORE_HTTP_PORTS=8080 SCOREMAP_APPLICATION_FILE=/run/scoremap/application.json
RUN mkdir -p /var/lib/scoremap/keys && chown -R $APP_UID /var/lib/scoremap && chmod 700 /var/lib/scoremap/keys
USER $APP_UID
ENTRYPOINT ["dotnet", "ScoreMap.Api.dll"]
