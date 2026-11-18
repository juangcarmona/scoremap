namespace JuanGCarmona.ScoreMap.Modules.Library.Application;

internal sealed class RevisionConflictException : Exception
{
  public RevisionConflictException() { }
  public RevisionConflictException(string message) : base(message) { }
  public RevisionConflictException(string message, Exception innerException) : base(message, innerException) { }
}
