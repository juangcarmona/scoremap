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
      catch (Exception error) when (error is ArgumentException or InvalidOperationException or JsonException or FormatException or KeyNotFoundException)
      { context.Response.StatusCode = 400; await Fault(context, 400, "Invalid or unsupported ScoreMap data. Existing content has not been replaced.").ConfigureAwait(false); }
    });
    var api = app.MapGroup("/api").RequireAuthorization().RequireRateLimiting("private-api");
    api.MapGet("/library", async (ClaimsPrincipal user, ReadLibraryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new ReadLibrary(Principal(user)), ct).ConfigureAwait(false)));
    api.MapPut("/library", async (ClaimsPrincipal user, CommitLibrary request, SaveLibraryHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new SaveLibrary(Principal(user), request), ct).ConfigureAwait(false)));
    api.MapPut("/songs/{id}/grants", async (ClaimsPrincipal user, string id, GrantRequest request, GrantSongHandler handler, CancellationToken ct) => { await handler.Handle(new GrantSong(Principal(user), id, request), ct).ConfigureAwait(false); return Results.NoContent(); });
    api.MapPost("/recovery-keys", async (ClaimsPrincipal user, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "create", Guid.Empty), ct).ConfigureAwait(false)));
    api.MapPost("/recovery-keys/{id:guid}/unlock", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => Results.Json(await handler.Handle(new RecoveryCommand(Principal(user), "unlock", id), ct).ConfigureAwait(false)));
    api.MapDelete("/recovery-keys/{id:guid}", async (ClaimsPrincipal user, Guid id, RecoveryKeyHandler handler, CancellationToken ct) => { await handler.Handle(new RecoveryCommand(Principal(user), "delete", id), ct).ConfigureAwait(false); return Results.NoContent(); });
    return app;
  }
  public static string Principal(ClaimsPrincipal user) => user.FindFirstValue("scoremap:principal") ?? throw new AccessDeniedException("A stable authenticated principal is required.");
  private static Task Fault(HttpContext context, int status, string detail) => Results.Problem(statusCode: status, title: status switch { 403 => "Forbidden", 409 => "Revision conflict", _ => "Invalid request" }, detail: detail, extensions: new Dictionary<string, object?>(StringComparer.Ordinal) { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
}
