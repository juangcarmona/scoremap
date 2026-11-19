# Private API contract (partial)

`npm run verify:private-api-contract` regenerates a document from the actual `MapPrivateLibrary` endpoints without starting a listener, PostgreSQL, or identity service. It compares the committed document and proves a new registered route is rejected as drift. The pinned .NET generator is restored in locked mode. To update after reviewing an intentional API change:

```sh
dotnet restore tests/contract/ScoreMap.Contract.csproj --locked-mode
dotnet run --project tests/contract/ScoreMap.Contract.csproj --configuration Release --no-restore -- "$PWD/tests/contract/private-api.openapi.json"
npm run verify:private-api-contract
```

This document covers private-library endpoint registrations and request envelopes, plus the response metadata declared on those registrations. `JsonElement` remains opaque: the document does not validate the internals of song or arrangement JSON. Host authentication routes, the complete error/status/security behavior, generated frontend bindings and client drift are not yet covered. This is not a published API endpoint or a complete OpenAPI contract.
