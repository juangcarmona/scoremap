import { copySongIdentities } from "./identityCopy";
import {
  applyScoreCommand,
  isScoreCommand,
  reconcileSharedRemoval,
  sectionRemovalImpact,
  type ScoreCommand,
  type Reconciliation,
} from "./scoreCommands";
import { isRichSong, type RichSection, type RichSong } from "./score";
import { validateRichScore } from "./scoreValidation";
import {
  sameData,
  requireValue,
  object,
  text,
  name,
  array,
} from "./validation";
export type Mode = "edit" | "performance";
import { assertChord, type Chord } from "../../shared/music/chord";
export { assertChord, type Chord };
export type LegacySection = {
  id: string;
  name: string;
  repeat: number;
  chords: Chord[];
  notes: string;
};
export type Reference = { id: string; title: string; url: string };
export type PdfAttachment = {
  id: string;
  name: string;
  data: string;
  pages: number;
  page: number;
};
export type LegacySong = {
  id: string;
  title: string;
  artist: string;
  notes: string;
  sections: LegacySection[];
  references: Reference[];
  pdf?: PdfAttachment;
};
export type Section = LegacySection | RichSection;
export type Song = LegacySong | RichSong;
export type Repertoire = { id: string; title: string; songIds: string[] };
export type Library = {
  schemaVersion: 1 | 2;
  revision: number;
  songs: Song[];
  repertoires: Repertoire[];
};
export const emptyLibrary = (): Library => ({
  schemaVersion: 1,
  revision: 0,
  songs: [],
  repertoires: [],
});

export function assertWebUrl(value: unknown): asserts value is string {
  text(value);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter an absolute HTTP or HTTPS link.");
  }
  requireValue(
    ["http:", "https:"].includes(url.protocol),
    "Only HTTP and HTTPS links are supported.",
  );
}
export function validateLibrary(value: unknown): Library {
  object(value, ["schemaVersion", "revision", "songs", "repertoires"]);
  requireValue(
    value.schemaVersion === 1 || value.schemaVersion === 2,
    "This library version is unsupported. Keep the original data and use a compatible ScoreMap version.",
  );
  requireValue(
    Number.isSafeInteger(value.revision) && Number(value.revision) >= 0,
    "Invalid library revision.",
  );
  array(value.songs);
  array(value.repertoires);
  const ids = new Set<string>();
  function identity(value: unknown) {
    name(value);
    requireValue(!ids.has(value), "Duplicate identity in library.");
    ids.add(value);
  }
  const songIds = new Set<string>();
  for (const song of value.songs) {
    const rich =
      typeof song === "object" &&
      song !== null &&
      "schemaVersion" in song &&
      song.schemaVersion === 2;
    object(
      song,
      [
        "id",
        "title",
        "artist",
        "notes",
        "sections",
        "references",
        ...(rich ? ["schemaVersion", "arrangements"] : []),
      ],
      ["pdf", ...(rich ? ["migration"] : [])],
    );
    requireValue(
      !rich || value.schemaVersion === 2,
      "An identified arrangement needs the version-2 library envelope.",
    );
    identity(song.id);
    songIds.add(song.id as string);
    name(song.title);
    text(song.artist);
    text(song.notes);
    array(song.sections);
    array(song.references);
    for (const section of song.sections) {
      object(section, [
        "id",
        "name",
        "repeat",
        "chords",
        "notes",
        ...(rich ? ["measures"] : []),
      ]);
      identity(section.id);
      name(section.name);
      text(section.notes);
      requireValue(
        Number.isInteger(section.repeat) &&
          Number(section.repeat) >= 1 &&
          Number(section.repeat) <= 99,
        "Repetitions must be a whole number from 1 to 99.",
      );
      array(section.chords);
      if (!rich) section.chords.forEach(assertChord);
    }
    if (rich) validateRichScore(song, identity);
    for (const ref of song.references) {
      object(ref, ["id", "title", "url"]);
      identity(ref.id);
      name(ref.title);
      assertWebUrl(ref.url);
    }
    if (song.pdf !== undefined) {
      object(song.pdf, ["id", "name", "data", "pages", "page"]);
      identity(song.pdf.id);
      name(song.pdf.name);
      text(song.pdf.data);
      requireValue(
        song.pdf.data.startsWith("JVBERi0") &&
          /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
            song.pdf.data,
          ),
        "Invalid PDF attachment data.",
      );
      requireValue(
        Number.isSafeInteger(song.pdf.pages) && Number(song.pdf.pages) >= 1,
        "Invalid PDF page count.",
      );
      requireValue(
        Number.isInteger(song.pdf.page) &&
          Number(song.pdf.page) >= 1 &&
          Number(song.pdf.page) <= Number(song.pdf.pages),
        "PDF page is out of range.",
      );
    }
  }
  for (const rep of value.repertoires) {
    object(rep, ["id", "title", "songIds"]);
    identity(rep.id);
    name(rep.title);
    array(rep.songIds);
    const members = new Set<string>();
    for (const id of rep.songIds) {
      text(id);
      requireValue(songIds.has(id), "A repertoire refers to a missing song.");
      requireValue(!members.has(id), "Duplicate repertoire membership.");
      members.add(id);
    }
  }
  return value as Library;
}
export function requireEdit(mode: Mode) {
  requireValue(
    mode === "edit",
    "Performance mode protects your music. Switch to Edit to make changes.",
  );
}
export type Command =
  | ScoreCommand
  | { type: "createSong"; id: string; title: string }
  | {
      type: "updateSong";
      songId: string;
      patch: Partial<Pick<Song, "title" | "artist" | "notes">>;
    }
  | { type: "deleteSong"; songId: string }
  | {
      type: "duplicateSong";
      songId: string;
      expected: Song;
      identities: Record<string, string>;
    }
  | { type: "createRepertoire"; id: string; title: string }
  | { type: "renameRepertoire"; repertoireId: string; title: string }
  | { type: "deleteRepertoire"; repertoireId: string }
  | {
      type: "addMembership" | "removeMembership";
      repertoireId: string;
      songId: string;
    }
  | { type: "insertSection"; songId: string; id: string; name: string }
  | {
      type: "updateSection";
      songId: string;
      sectionId: string;
      patch: Partial<
        Pick<LegacySection, "name" | "repeat" | "chords" | "notes">
      >;
    }
  | {
      type: "removeSection";
      songId: string;
      sectionId: string;
      reconciliation?: Reconciliation;
    }
  | { type: "reorderSections"; songId: string; order: string[] }
  | { type: "addReference"; songId: string; reference: Reference }
  | { type: "removeReference"; songId: string; referenceId: string }
  | { type: "attachPdf"; songId: string; pdf: PdfAttachment }
  | { type: "removePdf"; songId: string }
  | { type: "viewPdfPage"; songId: string; page: number };
export function applyCommand(
  library: Library,
  mode: Mode,
  command: Command,
): Library {
  if (command.type !== "viewPdfPage") requireEdit(mode);
  validateLibrary(library);
  const next = structuredClone(library);
  const song =
    "songId" in command
      ? next.songs.find((s) => s.id === command.songId)
      : undefined;
  if ("songId" in command) requireValue(song, "The song no longer exists.");
  if (isScoreCommand(command)) {
    requireValue(song, "The song no longer exists.");
    applyScoreCommand(next, song, command);
    return validateLibrary(next);
  }
  const rep =
    "repertoireId" in command
      ? next.repertoires.find((r) => r.id === command.repertoireId)
      : undefined;
  if ("repertoireId" in command)
    requireValue(rep, "The repertoire no longer exists.");
  const section =
    "sectionId" in command
      ? song!.sections.find((s) => s.id === command.sectionId)
      : undefined;
  if ("sectionId" in command)
    requireValue(section, "The section no longer exists.");
  switch (command.type) {
    case "createSong":
      next.songs.push({
        id: command.id,
        title: command.title.trim(),
        artist: "",
        notes: "",
        sections: [],
        references: [],
      });
      break;
    case "updateSong":
      requireValue(
        Object.keys(command.patch).every((k) =>
          ["title", "artist", "notes"].includes(k),
        ),
        "Invalid song update.",
      );
      Object.assign(song!, command.patch);
      break;
    case "duplicateSong": {
      requireValue(
        sameData(song, command.expected),
        "The song changed while its copy was prepared. Reload before making a new independent form.",
      );
      const values = Object.values(command.identities);
      requireValue(
        new Set(values).size === values.length,
        "Copied identities must be unique.",
      );
      next.songs.push(
        copySongIdentities(song!, (id) => {
          const copy = command.identities[id];
          requireValue(
            Object.hasOwn(command.identities, id) &&
              typeof copy === "string" &&
              copy.trim(),
            "Supply every copied song identity.",
          );
          return copy;
        }),
      );
      break;
    }
    case "deleteSong":
      next.songs = next.songs.filter((s) => s.id !== command.songId);
      for (const r of next.repertoires)
        r.songIds = r.songIds.filter((id) => id !== command.songId);
      break;
    case "createRepertoire":
      next.repertoires.push({
        id: command.id,
        title: command.title.trim(),
        songIds: [],
      });
      break;
    case "renameRepertoire":
      rep!.title = command.title.trim();
      break;
    case "deleteRepertoire":
      next.repertoires = next.repertoires.filter(
        (r) => r.id !== command.repertoireId,
      );
      break;
    case "addMembership":
      requireValue(
        !rep!.songIds.includes(command.songId),
        "This song is already in that repertoire.",
      );
      rep!.songIds.push(command.songId);
      break;
    case "removeMembership":
      requireValue(
        rep!.songIds.includes(command.songId),
        "This song is not in that repertoire.",
      );
      rep!.songIds = rep!.songIds.filter((id) => id !== command.songId);
      break;
    case "insertSection": {
      const target = song!;
      const created = {
        id: command.id,
        name: command.name.trim(),
        repeat: 1,
        chords: [],
        notes: "",
      };
      if (isRichSong(target))
        target.sections.push({ ...created, measures: [] });
      else target.sections.push(created);
      break;
    }
    case "updateSection":
      requireValue(
        Object.keys(command.patch).every((k) =>
          ["name", "repeat", "chords", "notes"].includes(k),
        ),
        "Invalid section update.",
      );
      requireValue(
        !isRichSong(song!) || command.patch.chords === undefined,
        "Edit identified harmonic events through their own commands.",
      );
      Object.assign(section!, command.patch);
      break;
    case "removeSection":
      if (isRichSong(song!)) {
        const target = song! as RichSong;
        reconcileSharedRemoval(
          target,
          sectionRemovalImpact(target, command.sectionId),
          command.reconciliation,
        );
      }
      song!.sections.splice(
        song!.sections.findIndex((s) => s.id === command.sectionId),
        1,
      );
      break;
    case "reorderSections": {
      const map = new Map<string, Section>(
        song!.sections.map((s) => [s.id, s]),
      );
      requireValue(
        map.size >= 2,
        "At least two sections are needed to reorder a song.",
      );
      requireValue(
        command.order.length === map.size &&
          new Set(command.order).size === map.size &&
          command.order.every((id) => map.has(id)),
        "The section order must contain every section exactly once.",
      );
      const target = song!;
      if (isRichSong(target))
        target.sections = command.order.map(
          (id) => map.get(id)! as RichSection,
        );
      else
        target.sections = command.order.map(
          (id) => map.get(id)! as LegacySection,
        );
      break;
    }
    case "addReference":
      song!.references.push(command.reference);
      break;
    case "removeReference":
      requireValue(
        song!.references.some((r) => r.id === command.referenceId),
        "The reference no longer exists.",
      );
      song!.references = song!.references.filter(
        (r) => r.id !== command.referenceId,
      );
      break;
    case "attachPdf":
      song!.pdf = command.pdf;
      break;
    case "removePdf":
      requireValue(song!.pdf, "This song has no PDF.");
      delete song!.pdf;
      break;
    case "viewPdfPage":
      requireValue(song!.pdf, "This song has no PDF.");
      song!.pdf.page = command.page;
      break;
    default:
      throw new Error("Unsupported operation.");
  }
  return validateLibrary(next);
}
