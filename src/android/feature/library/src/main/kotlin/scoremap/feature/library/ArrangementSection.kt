package scoremap.feature.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import scoremap.library.HandRole
import scoremap.music.Piano
import scoremap.music.PitchRange

internal fun LazyListScope.devicesSection(holder: LibraryHolder) {
    val detail = holder.detail ?: return
    val arrangement = holder.models.editors.arrangement
    item { Text("Devices", style = MaterialTheme.typography.titleMedium) }
    item {
        NameEntry("Device name", "Add device") { name ->
            holder.act { mode -> arrangement.addDevice(detail.id, name, "", mode) }
        }
    }
    items(detail.devices, key = { "device-${it.id}" }) { device ->
        NamedRow("Device: ${device.name}, range ${device.range}") {
            DestructiveButton("Remove device", "Remove device ${device.name}") {
                holder.act { mode -> arrangement.removeDevice(detail.id, device.id, false, mode) }
            }
            if (device.bindingCount > 0) {
                DestructiveButton("Remove device and bindings", "Remove device ${device.name} and its bindings") {
                    holder.act { mode -> arrangement.removeDevice(detail.id, device.id, true, mode) }
                }
            }
        }
        SheetEntry("Range of ${device.name}", device.range, "Save range", false) { text ->
            holder.act { mode -> arrangement.setDeviceRange(detail.id, device.id, text, mode) }
        }
    }
}

/** One part's hand metadata and its bindings, with an entry to bind it to each device. */
@Composable
internal fun partArrangement(
    holder: LibraryHolder,
    songId: String,
    part: PartItem,
) {
    val arrangement = holder.models.editors.arrangement
    val detail = holder.detail ?: return
    Text("Hand of ${part.name}: ${handLabel(part.hand)}")
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        (HandRole.entries.map { it to handLabel(it) } + (null to "unassigned")).forEach { (role, label) ->
            ActionButton(label.replaceFirstChar { it.uppercase() }, "Set hand of ${part.name} to $label") {
                holder.act { mode -> arrangement.setHand(songId, part.id, role, mode) }
            }
        }
    }
    part.bindings.forEach { binding ->
        val sound = if (binding.sound.isEmpty()) "" else ", sound ${binding.sound}"
        NamedRow("Binding: ${part.name} on ${binding.device}, ${binding.range}$sound") {
            DestructiveButton(
                "Remove binding",
                "Remove binding of ${part.name} on ${binding.device} ${binding.range}",
            ) {
                holder.act { mode -> arrangement.removeBinding(songId, binding.id, mode) }
            }
        }
    }
    detail.devices.forEach { device -> BindingEntry(holder, songId, part, device) }
}

private fun fullRange(device: DeviceItem): PitchRange = ArrangementModel.parseRange(device.range) ?: Piano.range

internal fun handLabel(hand: HandRole?): String =
    when (hand) {
        HandRole.LEFT -> "left"
        HandRole.RIGHT -> "right"
        HandRole.BOTH -> "both"
        HandRole.CONTEXTUAL -> "contextual"
        null -> "unassigned"
    }

@Composable
private fun BindingEntry(
    holder: LibraryHolder,
    songId: String,
    part: PartItem,
    device: DeviceItem,
) {
    var pending by remember(part.id, device.id) { mutableStateOf<BindText?>(null) }
    val arrangement = holder.models.editors.arrangement
    NameEntry("Range of ${part.name} on ${device.name}", "Bind") { text ->
        val request = BindText(songId, part.id, device.id, text, "", fullRange(device))
        holder.act { mode ->
            val notice = arrangement.bind(request, mode)
            if (notice == Notice.EXCLUDES_NOTES) pending = request
            notice
        }
    }
    val request = pending
    if (request != null) {
        AlertDialog(
            containerColor = MaterialTheme.colorScheme.surface,
            onDismissRequest = { pending = null },
            title = { Text("Keep notes outside the range?") },
            text = {
                Text(
                    "${part.name} plays notes outside ${request.rangeText}. " +
                        "Keep those exact pitches when binding to ${device.name}?",
                )
            },
            confirmButton = {
                ActionButton("Keep notes and bind", "Keep notes and bind", style = ActionStyle.PRIMARY) {
                    pending = null
                    holder.act { mode -> arrangement.bind(request.copy(rangeText = request.rangeText + "!"), mode) }
                }
            },
            dismissButton = { ActionButton("Cancel", "Cancel binding range") { pending = null } },
        )
    }
}
