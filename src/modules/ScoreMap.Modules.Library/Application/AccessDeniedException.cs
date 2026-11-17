namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class AccessDeniedException : Exception
{
  public AccessDeniedException() { }
  public AccessDeniedException(string message) : base(message) { }
  public AccessDeniedException(string message, Exception innerException) : base(message, innerException) { }
}
