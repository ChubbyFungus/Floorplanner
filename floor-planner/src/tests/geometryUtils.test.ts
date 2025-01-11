import { calculateAreaAndVolume } from "../utils/geometryUtils";
import { WallData, FixtureData } from "../types";

describe("geometryUtils - Advanced Tests", () => {
  it("should return zero if no walls", () => {
    const result = calculateAreaAndVolume([], []);
    expect(result.totalArea).toBe(0);
    expect(result.totalVolume).toBe(0);
  });

  it("should compute area for a simple square loop of 4 walls", () => {
    const walls: WallData[] = [
      {
        id: "w1",
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 5,
        height: 96
      },
      {
        id: "w2",
        start: { x: 100, y: 0 },
        end: { x: 100, y: 100 },
        thickness: 5,
        height: 96
      },
      {
        id: "w3",
        start: { x: 100, y: 100 },
        end: { x: 0, y: 100 },
        thickness: 5,
        height: 96
      },
      {
        id: "w4",
        start: { x: 0, y: 100 },
        end: { x: 0, y: 0 },
        thickness: 5,
        height: 96
      }
    ];
    const fixtures: FixtureData[] = [];

    const result = calculateAreaAndVolume(walls, fixtures);
    // 100 x 100 => 10,000 area
    expect(result.totalArea).toBeCloseTo(10000, 0);

    // Volume => 10,000 * 96
    expect(result.totalVolume).toBeCloseTo(960000, 0);
  });
});
