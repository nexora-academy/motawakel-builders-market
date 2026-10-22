// هندسة شعار مؤسسة المتوكل: مثلث مُصمت بخطوط أفقية مفرغة + 3 خطوط مائلة.
// الإحداثيات بنظام SVG (y لتحت) داخل مساحة 470×615.

export type Point = [number, number];

export const LOGO_VIEWBOX = { width: 470, height: 615 } as const;

const APEX_Y = 210;
const BASE_Y = 605;
const LEFT_SLOPE = 140 / 395;
const RIGHT_SLOPE = 150 / 395;
const SPINE = 22;
const CUTS: [number, number][] = [
  [342, 362],
  [402, 422],
  [462, 482],
];

const xL = (y: number) => 150 - (y - APEX_Y) * LEFT_SLOPE;
const xR = (y: number) => 150 + (y - APEX_Y) * RIGHT_SLOPE;
const xS = (y: number) => xR(y) - SPINE;

const r = (n: number) => Math.round(n * 10) / 10;
const p = (x: number, y: number): Point => [r(x), r(y)];

function buildComb(): Point[] {
  const pts: Point[] = [p(150, APEX_Y), p(xR(BASE_Y), BASE_Y), p(xL(BASE_Y), BASE_Y)];
  // نطلع لفوق على الحافة الشمال ونفرّغ كل خط أفقي
  for (let i = CUTS.length - 1; i >= 0; i--) {
    const [top, bottom] = CUTS[i];
    pts.push(p(xL(bottom), bottom), p(xS(bottom), bottom), p(xS(top), top), p(xL(top), top));
  }
  return pts;
}

function buildStripes(): Point[][] {
  const tops = [140, 70, 10];
  const width = 24;
  return tops.map((yt, k) => {
    const off = 22 + k * 46;
    return [
      p(xR(yt) + off, yt),
      p(xR(yt) + off + width, yt),
      p(xR(BASE_Y) + off + width, BASE_Y),
      p(xR(BASE_Y) + off, BASE_Y),
    ];
  });
}

export const LOGO_POLYGONS: Point[][] = [buildComb(), ...buildStripes()];

export function polygonToPath(points: Point[]): string {
  return `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
}
