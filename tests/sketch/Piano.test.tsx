import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Piano } from "../../src/features/sketch/Piano";
it("SB-KEYBOARD SB-CHORD-MODIFY: selected chord immediately changes actual highlighted keys", () => {
  const { container, rerender } = render(
    <Piano chord={{ root: "C", quality: "major" }} />,
  );
  const highlighted = () =>
    [...container.querySelectorAll('[data-highlighted="true"]')]
      .map((e) => Number(e.getAttribute("data-midi")))
      .sort((a, b) => a - b);
  expect(highlighted()).toEqual([48, 52, 55, 60, 64, 67]);
  rerender(<Piano chord={{ root: "Db", quality: "minor" }} />);
  expect(
    screen.getByRole("img", { name: "Db minor piano keyboard" }),
  ).toBeInTheDocument();
  expect(highlighted()).toEqual([49, 52, 56, 61, 64, 68]);
});
