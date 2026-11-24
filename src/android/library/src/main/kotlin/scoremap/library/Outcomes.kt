package scoremap.library

internal fun guarded(
    mode: Mode,
    command: () -> Outcome<Library>,
): Outcome<Library> = if (mode == Mode.EDIT) command() else refused(Refusal.PERFORMANCE_MODE)

internal fun accepted(library: Library): Outcome<Library> = Outcome.Accepted(library)

internal fun refused(refusal: Refusal): Outcome<Library> = Outcome.Refused(refusal)

/** Cancelling changes nothing; a purge must name the item exactly. */
internal fun refusalFor(
    confirmation: Confirmation,
    needsName: String?,
): Refusal? =
    when {
        confirmation == Confirmation.Cancelled -> Refusal.CANCELLED
        needsName != null && confirmation != Confirmation.Named(needsName) -> Refusal.CONFIRMATION_MISMATCH
        else -> null
    }
