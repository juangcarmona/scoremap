using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace JuanGCarmona.ScoreMap.Api.Security;

internal sealed partial class ProviderSession(IHttpClientFactory clients, IConfiguration configuration, ILogger<ProviderSession> logger) : CookieAuthenticationEvents
{
  public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context) { context.Response.StatusCode = 401; return Task.CompletedTask; }
  public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context) { context.Response.StatusCode = 403; return Task.CompletedTask; }
  public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
  {
    var authority = configuration["Identity:Authority"]!;
    var client = clients.CreateClient("identity");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(configuration["Identity:ClientId"] + ":" + configuration["Identity:ClientSecret"])));
    var token = context.Properties.GetTokenValue("access_token");
    try
    {
      var expires = context.Properties.GetTokenValue("expires_at");
      if (DateTimeOffset.TryParse(expires, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var expiration) && expiration <= DateTimeOffset.UtcNow.AddSeconds(30))
      {
        using var refresh = await client.PostAsync(authority + "/protocol/openid-connect/token", new FormUrlEncodedContent(new Dictionary<string, string> { ["grant_type"] = "refresh_token", ["refresh_token"] = context.Properties.GetTokenValue("refresh_token") ?? "" }), context.HttpContext.RequestAborted).ConfigureAwait(false);
        refresh.EnsureSuccessStatusCode();
        using var result = JsonDocument.Parse(await refresh.Content.ReadAsStringAsync(context.HttpContext.RequestAborted).ConfigureAwait(false));
        token = result.RootElement.GetProperty("access_token").GetString();
        context.Properties.UpdateTokenValue("access_token", token!);
        context.Properties.UpdateTokenValue("refresh_token", result.RootElement.GetProperty("refresh_token").GetString()!);
        context.Properties.UpdateTokenValue("expires_at", DateTimeOffset.UtcNow.AddSeconds(result.RootElement.GetProperty("expires_in").GetInt32()).ToString("O", CultureInfo.InvariantCulture));
        context.ShouldRenew = true;
      }
      using var response = await client.PostAsync(authority + "/protocol/openid-connect/token/introspect", new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = token ?? "" }), context.HttpContext.RequestAborted).ConfigureAwait(false);
      var present = token is { Length: > 0 };
      LogStatus(logger, (int)response.StatusCode, present);
      response.EnsureSuccessStatusCode();
      using var introspection = JsonDocument.Parse(await response.Content.ReadAsStringAsync(context.HttpContext.RequestAborted).ConfigureAwait(false));
      var isActive = introspection.RootElement.TryGetProperty("active", out var active) && active.GetBoolean();
      LogActive(logger, isActive);
      if (isActive) return;
    }
    catch (Exception error) when (error is HttpRequestException or JsonException or TaskCanceledException or InvalidOperationException or KeyNotFoundException) { LogRefusal(logger, error.GetType().Name); }
    context.RejectPrincipal();
    await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme).ConfigureAwait(false);
  }
  [LoggerMessage(Level = LogLevel.Debug, Message = "Provider introspection status {Status}; access token present {Present}")]
  private static partial void LogStatus(ILogger logger, int status, bool present);
  [LoggerMessage(Level = LogLevel.Warning, Message = "Provider session check refused: {ErrorType}")]
  private static partial void LogRefusal(ILogger logger, string errorType);
  [LoggerMessage(Level = LogLevel.Debug, Message = "Provider active: {Active}")]
  private static partial void LogActive(ILogger logger, bool active);
}
