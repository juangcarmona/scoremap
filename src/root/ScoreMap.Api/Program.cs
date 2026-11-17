using System.Security.Claims;
using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using JuanGCarmona.ScoreMap.Api;
using Microsoft.AspNetCore.HttpOverrides;
using JuanGCarmona.ScoreMap.Api.Security;
using JuanGCarmona.ScoreMap.Modules.Library;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

var selected = Environment.GetEnvironmentVariable("SCOREMAP_APPLICATION_FILE");
if (string.IsNullOrWhiteSpace(selected)) throw new InvalidOperationException("Select SCOREMAP_APPLICATION_FILE; see config/application.example.json.");
using var selectedDocument = ApplicationSettings.Read(selected);
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { Args = args, WebRootPath = Path.GetFullPath(selectedDocument.RootElement.GetProperty("Application").GetProperty("WebRoot").GetString()!) });
builder.Configuration.AddJsonFile(Path.GetFullPath(selected), optional: false, reloadOnChange: false);
var config = builder.Configuration;
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http", LogLevel.Warning);
builder.Logging.AddFilter("JuanGCarmona.ScoreMap.Api.Security.ProviderSession", LogLevel.Debug);
foreach (var key in new[] { "Identity:Authority", "Identity:ClientId", "Identity:ClientSecret", "Storage:ConnectionString", "Storage:KeysPath", "Application:PublicOrigin", "Application:WebRoot" })
  if (string.IsNullOrWhiteSpace(config[key])) throw new InvalidOperationException("Missing required configuration: " + key);
var development = builder.Environment.IsDevelopment();
if (!string.Equals(config["Environment"], builder.Environment.EnvironmentName, StringComparison.Ordinal)) throw new InvalidOperationException("Selected configuration conflicts with the actual application environment.");
if (!development && selectedDocument.RootElement.TryGetProperty("Development", out _)) throw new InvalidOperationException("Production configuration cannot include Development seeds or infrastructure defaults.");
var origin = new Uri(config["Application:PublicOrigin"]!);
if (development && origin.Scheme != "https" && !string.Equals(origin.Host, "localhost", StringComparison.OrdinalIgnoreCase) && !(IPAddress.TryParse(origin.Host, out var loopback) && IPAddress.IsLoopback(loopback))) throw new InvalidOperationException("Development HTTP is restricted to loopback; use the documented SSH tunnel or qualified HTTPS.");
if (!development && (origin.Scheme != "https" || !config.GetValue<bool>("Application:ProductionQualified") || config.GetValue<bool>("Identity:DevelopmentFixture"))) throw new InvalidOperationException("Production requires qualified HTTPS identity/configuration; Development fixtures are refused.");
if (!development && new Uri(config["Identity:Authority"]!).Scheme != "https") throw new InvalidOperationException("Production identity requires HTTPS.");

builder.Services.AddDataProtection().SetApplicationName("ScoreMap").PersistKeysToFileSystem(new DirectoryInfo(Path.GetFullPath(config["Storage:KeysPath"]!)));
builder.Services.AddHttpClient("identity", client => client.Timeout = TimeSpan.FromSeconds(10));
builder.Services.AddScoped<ProviderSession>();
builder.Services.AddPrivateLibrary(config["Storage:ConnectionString"]!);
builder.Services.AddAntiforgery(options => { options.HeaderName = "X-ScoreMap-CSRF"; options.Cookie.HttpOnly = true; options.Cookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always; options.Cookie.SameSite = SameSiteMode.Strict; });
builder.Services.AddAuthentication(options => { options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme; options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme; })
    .AddCookie(options =>
    {
      options.Cookie.Name = "scoremap.session"; options.Cookie.HttpOnly = true; options.Cookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always; options.Cookie.SameSite = SameSiteMode.Lax;
      options.ExpireTimeSpan = TimeSpan.FromHours(8); options.SlidingExpiration = false; options.EventsType = typeof(ProviderSession);
      options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    })
    .AddOpenIdConnect(options =>
    {
      options.Authority = config["Identity:Authority"]; options.ClientId = config["Identity:ClientId"]; options.ClientSecret = config["Identity:ClientSecret"];
      options.ResponseType = OpenIdConnectResponseType.Code; options.ResponseMode = OpenIdConnectResponseMode.Query; options.UsePkce = true; options.RequireHttpsMetadata = !development;
      options.SaveTokens = true; options.MapInboundClaims = false; options.GetClaimsFromUserInfoEndpoint = false;
      options.NonceCookie.SameSite = SameSiteMode.Lax; options.CorrelationCookie.SameSite = SameSiteMode.Lax;
      options.NonceCookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
      options.CorrelationCookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
      options.Events.OnTokenValidated = context =>
      {
        var sub = context.Principal?.FindFirstValue("sub") ?? throw new InvalidOperationException("Missing provider subject.");
        ((ClaimsIdentity)context.Principal!.Identity!).AddClaim(new Claim("scoremap:principal", context.SecurityToken.Issuer + "|" + sub));
        return Task.CompletedTask;
      };
      options.Events.OnRemoteFailure = context =>
      {
        context.HandleResponse();
        return Results.Problem(statusCode: 400, title: "Sign-in could not be completed", detail: "Start sign-in again from ScoreMap. No private library was opened.").ExecuteAsync(context.HttpContext);
      };
    });
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
  options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
  if (config["Ingress:TrustedProxy"] is { Length: > 0 } trusted) options.KnownProxies.Add(IPAddress.Parse(trusted));
});
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context => context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier);
builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = 429;
  options.AddPolicy("private-api", context => RateLimitPartition.GetFixedWindowLimiter(context.User.FindFirstValue("scoremap:principal") ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 300, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
  options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddAuthorization();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 70 * 1024 * 1024);
var app = builder.Build();
await app.Services.InitializePrivateLibrary();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.Use(async (context, next) =>
{
  context.Response.Headers["X-Content-Type-Options"] = "nosniff";
  context.Response.Headers["Referrer-Policy"] = "same-origin";
  if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/auth")) context.Response.Headers.CacheControl = "no-store";
  await next(context);
});
app.UseForwardedHeaders();
if (!development) app.UseHsts();
app.UseAuthentication(); app.UseAuthorization();
app.UseRateLimiter();
app.Use(async (context, next) =>
{
  if ((context.Request.Path.StartsWithSegments("/api") || context.Request.Path == "/auth/logout") && !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
  {
    if (context.User.Identity?.IsAuthenticated != true) { context.Response.StatusCode = 401; return; }
    if (context.Request.Headers.Origin.Count > 0 && context.Request.Headers.Origin != origin.GetLeftPart(UriPartial.Authority)) { context.Response.StatusCode = 403; return; }
    try { await context.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context); }
    catch (AntiforgeryValidationException) { context.Response.StatusCode = 400; return; }
  }
  await next(context);
});
app.MapGet("/auth/login", () => Results.Challenge(new AuthenticationProperties { RedirectUri = "/" }, [OpenIdConnectDefaults.AuthenticationScheme])).RequireRateLimiting("login");
app.MapGet("/auth/session", (HttpContext context, IAntiforgery antiforgery) => context.User.Identity?.IsAuthenticated == true ? Results.Json(new { authenticated = true, principal = LibraryModule.Principal(context.User), name = context.User.FindFirstValue("preferred_username") ?? "Musician", csrf = antiforgery.GetAndStoreTokens(context).RequestToken }) : Results.Json(new { authenticated = false }));
app.MapPost("/auth/logout", () => Results.SignOut(new AuthenticationProperties { RedirectUri = "/" }, [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme])).RequireAuthorization();
app.MapHealthChecks("/health/ready");
app.MapPrivateLibrary();
app.UseDefaultFiles(); app.UseStaticFiles();
app.MapFallbackToFile("index.html");
await app.RunAsync();
