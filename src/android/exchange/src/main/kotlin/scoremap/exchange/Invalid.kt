package scoremap.exchange

/** A package that cannot be accepted, carrying why. */
internal class Invalid(
    val reason: Rejection,
) : Exception()

internal fun invalid(): Nothing = throw Invalid(Rejection.INVALID_STRUCTURE)

internal fun need(
    condition: Boolean,
    reason: Rejection,
) {
    if (!condition) throw Invalid(reason)
}

internal fun text(
    obj: Json.Obj,
    name: String,
): String = (obj.fields[name] as? Json.Text ?: invalid()).value

/** The object has every required field, and no field other than the required and optional ones. */
internal fun exactly(
    obj: Json.Obj,
    required: Set<String>,
    optional: Set<String> = emptySet(),
) {
    if (!obj.fields.keys.containsAll(required) || !(required + optional).containsAll(obj.fields.keys)) invalid()
}
