package scoremap.feature.library

import scoremap.library.Refusal
import scoremap.library.ServiceResult

/** The one place that turns an application result into what the musician is told. */
internal fun resultNotice(
    result: ServiceResult,
    success: Notice,
): Notice =
    when (result) {
        is ServiceResult.Acknowledged -> success
        is ServiceResult.Refused -> refusalNotice(result.refusal)
        is ServiceResult.Conflict -> Notice.CONFLICT
        is ServiceResult.StorageFailed -> Notice.STORAGE_FAILED
    }

private fun refusalNotice(refusal: Refusal): Notice =
    when (refusal) {
        Refusal.PERFORMANCE_MODE -> Notice.EDIT_MODE_REQUIRED
        Refusal.INVALID_NAME -> Notice.INVALID_NAME
        Refusal.MISSING_DEPENDENCY -> Notice.MISSING_DEPENDENCY
        Refusal.STALE_REVISION -> Notice.CONFLICT
        else -> Notice.FAILED
    }
