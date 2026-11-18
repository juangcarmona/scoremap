import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PerformedPiano } from "../../src/features/sketch/PerformedPiano";
afterEach(cleanup);
const pitches = [
  { spelling: "Db", octave: 3, midi: 49 },
  { spelling: "F", octave: 3, midi: 53 },
  { spelling: "Ab", octave: 4, midi: 68 },
];
describe("Exact performed piano", () => {
  it("distinguishes only Db3/F3/Ab4 as played while keeping all theoretical octaves separate and correctly spelled", async () => {
    const toggle = vi.fn();
    render(
      <PerformedPiano
        harmony={{ root: "Db", quality: "major" }}
        pitches={pitches}
        firstOctave={3}
        octaves={2}
        editable
        onToggle={toggle}
        label="Selected part"
      />,
    );
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(3);
    expect(
      screen.getByRole("button", {
        name: "D♭3 · performed · theoretical tone",
      }),
    ).toHaveAttribute("data-midi", "49");
    expect(
      screen.getByRole("button", {
        name: "D♭4 · not performed · theoretical tone",
      }),
    ).toHaveAttribute("aria-pressed", "false");
    const key = screen.getByRole("button", {
      name: "A♭4 · performed · theoretical tone",
    });
    key.focus();
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveBeenCalledWith(pitches[2]);
  });
  it("retains off-screen notes and refuses mutation in consultation", () => {
    const toggle = vi.fn();
    render(
      <PerformedPiano
        harmony={{ root: "C", quality: "major-seventh" }}
        pitches={[{ spelling: "B", octave: 5, midi: 83 }]}
        firstOctave={3}
        octaves={2}
        editable={false}
        onToggle={toggle}
        label="Right"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Outside this view: B5",
    );
    expect(
      screen
        .getAllByRole("button")
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(toggle).not.toHaveBeenCalled();
  });
});
