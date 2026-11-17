using System.Security.Claims;
using System.Text.Json;
using JuanGCarmona.ScoreMap.Modules.Library.Application;
using JuanGCarmona.ScoreMap.Modules.Library.Contracts;
using JuanGCarmona.ScoreMap.Modules.Library.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace JuanGCarmona.ScoreMap.Modules.Library;

public static class LibraryModule
{
  public static IServiceCollection AddPrivateLibrary(this IServiceCollection services, string connectionString)
  {
    services.AddSingleton(NpgsqlDataSource.Create(connectionString));
    services.AddSingleton<LibraryRepository>();
    services.AddHealthChecks().AddCheck<DatabaseHealth>("postgresql");
    services.AddSingleton<ILibraryRepository>(s => s.GetRequiredService<LibraryRepository>());
    services.AddSingleton<HistoryQueryHandler>(); services.AddSingleton<RecoverSongHandler>();
    services.AddSingleton<DeviceConfigurationCommandHandler>(); services.AddSingleton<DeviceConfigurationQueryHandler>();
    services.AddSingleton<PresetCommandHandler>(); services.AddSingleton<PresetQueryHandler>();
    services.AddSingleton<ReadNotationHandler>(); services.AddSingleton<SaveNotationHandler>();
    services.AddSingleton<ReadLibraryHandler>(); services.AddSingleton<SaveLibraryHandler>(); services.AddSingleton<GrantSongHandler>(); services.AddSingleton<SessionVault>(); services.AddSingleton<RecoveryVault>(); services.AddSingleton<IRecoveryKeyRepository>(s => s.GetRequiredService<RecoveryVault>()); services.AddSingleton<RecoveryKeyHandler>();
    services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme).Configure<SessionVault>((options, vault) => options.SessionStore = vault);
    return services;
  }
  public static async Task InitializePrivateLibrary(this IServiceProvider services, CancellationToken ct = default) { await services.GetRequiredService<LibraryRepository>().Initialize(ct).ConfigureAwait(false); await services.GetRequiredService<RecoveryVault>().Initialize(ct).ConfigureAwait(false); }
  public static WebApplication MapPrivateLibrary(this WebApplication app)
  {
    app.Use(async (context, next) =>
    {
      try { await next(context).ConfigureAwait(false); }
      catch (AccessDeniedException) { context.Response.StatusCode = 403; await Fault(context, 403, "This operation is unavailable for your current permissions.").ConfigureAwait(false); }
      catch (RevisionConflictException error) { context.Response.StatusCode = 409; await Fault(context, 409, error.Message).ConfigureAwait(false); }
      catch (BadHttpRequestException error) when (error.StatusCode is >= 400 and < 500)
      { context.Response.StatusCode = error.StatusCode; await Fault(context, error.StatusCode, "Invalid or unsupported request data. Existing content has not been replaced.").ConfigureAwait(false); }
      catch (Exception error) when (error is ArgumentException or InvalidOperationException or JsonException or FormatException or KeyNotFoundException)
      { context.Response.StatusCode = 400; await Fault(context, 400, "Invalid or unsupported ScoreMap data. Existing content has not been replaced.").ConfigureAwait(false); }
    });
    var api = app.MapGroup("/api").RequireAuthorization().RequireRateLimiting("private-api");
    api.MapGet("/device-configurations", async (ClaimsPrincipal user, DeviceConfigurationQueryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new DeviceConfigurationQuery(Principal(user)), ct).ConfigureAwait(false)));
    api.MapPost("/device-configurations", async (ClaimsPrincipal user, DeviceConfigurationRequest request, DeviceConfigurationCommandHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new DeviceConfigurationCommand(Principal(user), request), ct).ConfigureAwait(false)));
    api.MapGet("/voicing-presets", async (ClaimsPrincipal user, PresetQueryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new PresetQuery(Principal(user)), ct).ConfigureAwait(false)));
    api.MapPost("/voicing-presets", async (ClaimsPrincipal user, PresetRequest request, PresetCommandHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new PresetCommand(Principal(user), request), ct).ConfigureAwait(false)));
    api.MapGet("/preferences/notation", async (ClaimsPrincipal user, ReadNotationHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new ReadNotation(Principal(user)), ct).ConfigureAwait(false)));
    api.MapPut("/preferences/notation", async (ClaimsPrincipal user, NotationRequest request, SaveNotationHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new SaveNotation(Principal(user), request), ct).ConfigureAwait(false)));
    api.MapGet("/library", async (ClaimsPrincipal user, ReadLibraryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new ReadLibrary(Principal(user)), ct).ConfigureAwait(false)));
    api.MapPut("/library", async (ClaimsPrincipal user, CommitLibrary request, SaveLibraryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new SaveLibrary(Principal(user), request), ct).ConfigureAwait(false)));
    api.MapPut("/songs/{id}/grants", async (ClaimsPrincipal user, string id, GrantRequest request, GrantSongHandler handler, CancellationToken ct) => { await handler.Handle(new GrantSong(Principal(user), id, request), ct).ConfigureAwait(false); return Results.NoContent(); });
    api.MapPost("/recovery-keys", async (ClaimsPrincipal user, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "create", Guid.Empty), ct).ConfigureAwait(false)));
    api.MapPost("/recovery-keys/{id:guid}/unlock", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "unlock", id), ct).ConfigureAwait(false)));
    api.MapDelete("/recovery-keys/{id:guid}", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => { await handler.Handle(new RecoveryCommand(Principal(user), "delete", id), ct).ConfigureAwait(false); return Results.NoContent(); });
    api.MapPost("/personal-recovery-keys", async (ClaimsPrincipal user, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "create", Guid.Empty, "personal"), ct).ConfigureAwait(false)));
    api.MapPost("/personal-recovery-keys/{id:guid}/unlock", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "unlock", id, "personal"), ct).ConfigureAwait(false)));
    api.MapDelete("/personal-recovery-keys/{id:guid}", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => { await handler.Handle(new RecoveryCommand(Principal(user), "delete", id, "personal"), ct).ConfigureAwait(false); return Results.NoContent(); });
    api.MapGet("/trash", async (ClaimsPrincipal user, HistoryQueryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new HistoryQuery(Principal(user), null), ct).ConfigureAwait(false)));
    api.MapGet("/songs/{id}/history", async (ClaimsPrincipal user, string id, HistoryQueryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new HistoryQuery(Principal(user), id), ct).ConfigureAwait(false)));
    api.MapPost("/songs/{id}/restore", async (ClaimsPrincipal user, string id, RestoreRequest request, RecoverSongHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoverSong(Principal(user), id, "restore", request), ct).ConfigureAwait(false)));
    api.MapPost("/songs/{id}/purge", async (ClaimsPrincipal user, string id, RestoreRequest request, RecoverSongHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoverSong(Principal(user), id, "purge", request), ct).ConfigureAwait(false)));
    api.Map("/{**path}", () => Results.Problem(statusCode: 404, title: "Not found", detail: "The private resource is unavailable."));
    return app;
  }
  public static string Principal(ClaimsPrincipal user) => user.FindFirstValue("scoremap:principal") ?? throw new AccessDeniedException("A stable authenticated principal is required.");
  private static Task Fault(HttpContext context, int status, string detail) => Results.Problem(statusCode: status, title: status switch { 403 => "Forbidden", 409 => "Revision conflict", _ => "Invalid request" }, detail: detail, extensions: new Dictionary<string, object?>(StringComparer.Ordinal) { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
}
