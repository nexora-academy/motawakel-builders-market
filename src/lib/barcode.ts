// باركود Code 39 لرقم الطلب — كل حرف 9 عناصر (خط/مسافة بالتبادل)، n = رفيع و w = عريض
const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn",
  "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
  "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw",
  C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn",
  G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww",
  O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn",
  S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw",
  W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn",
  "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
};

export type Bar = { x: number; width: number };

export const CODE39_CHARS = Object.keys(CODE39);

/** يحوّل النص لخطوط باركود. الحروف غير المدعومة بتتشال. */
export function code39Bars(text: string, narrow = 2, wide = 5) {
  const clean = text.toUpperCase().split("").filter((c) => c !== "*" && CODE39[c]).join("");
  const chars = `*${clean}*`.split("");
  const bars: Bar[] = [];
  let x = 0;
  chars.forEach((ch, ci) => {
    const pattern = CODE39[ch];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === "w" ? wide : narrow;
      if (i % 2 === 0) bars.push({ x, width: w });
      x += w;
    }
    if (ci < chars.length - 1) x += narrow; // مسافة بين الحروف
  });
  return { bars, width: x, text: clean };
}
