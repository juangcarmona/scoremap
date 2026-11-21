import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PianoOverview } from "../../src/features/library/PianoOverview";

afterEach(cleanup);

describe("88-key orientation", () => {
  it("shows the whole instrument and retains selected pitches when the visible range changes", () => {
    const pitches = [
      { spelling: "A", octave: 0, midi: 21 },
      { spelling: "C", octave: 8, midi: 108 },
    ];
    const { container, rerender } = render(
      <PianoOverview pitches={pitches} firstOctave={0} octaves={2} />,
    );
    expect(container.querySelectorAll("rect")).toHaveLength(88);
    const low = container.querySelector('[data-midi="21"]');
    const high = container.querySelector('[data-midi="108"]');
    expect(low).toHaveAttribute("data-selected", "true");
    expect(low).toHaveAttribute("data-in-view", "true");
    expect(high).toHaveAttribute("data-selected", "true");
    expect(high).toHaveAttribute("data-in-view", "false");
    rerender(<PianoOverview pitches={pitches} firstOctave={7} octaves={2} />);
    expect(low).toHaveAttribute("data-selected", "true");
    expect(low).toHaveAttribute("data-in-view", "false");
    expect(high).toHaveAttribute("data-selected", "true");
    expect(high).toHaveAttribute("data-in-view", "true");
    expect(screen.getByRole("img")).toHaveAccessibleName(/88-key piano/);
  });
});
