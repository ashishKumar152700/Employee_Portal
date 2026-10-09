// Component/Effects/BurnCard.tsx
// "Paper burn" dismiss effect for any card.
//
//   <BurnCard burning={dismissed} origin="bottom-right" onBurnComplete={remove}>
//     <MyCard />
//   </BurnCard>
//
// How it works: when `burning` turns true the card is snapshotted into a Skia
// image and replaced by one Skia canvas running an SkSL shader. Per pixel:
//   burnValue = distance-to-nearest-ignition-point + fbm noise
// Pixels whose burnValue is below the advancing threshold are discarded
// (fully transparent); the band just above it is coloured as an ember line,
// a wider band as char, and flames are drawn *upward* from the ember line,
// flickering with time-based noise. Sparks are additive-blended circles that
// break off where the front passes. Everything is driven on the UI thread by
// one Reanimated value, then the canvas is dropped and `onBurnComplete` fires.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated as RNAnimated, StyleSheet, View } from "react-native";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  ImageShader,
  makeImageFromView,
  Rect,
  Shader,
  Skia,
  SkImage,
} from "@shopify/react-native-skia";
import {
  Easing,
  runOnJS,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Public API ────────────────────────────────────────────────────────────
export type BurnPoint =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | { x: number; y: number }; // 0..1 within the card

export type BurnOrigin = BurnPoint | "edges" | "random" | BurnPoint[];

export type BurnCardProps = {
  burning: boolean;
  origin?: BurnOrigin;
  /** Burn time in ms (sparks linger ~0.7s after). Default 1700. */
  duration?: number;
  onBurnComplete?: () => void;
  children: React.ReactNode;
};

// Room around the card for flames and sparks that rise above it.
const PAD = { top: 44, x: 16, bottom: 10 };
const TAIL_MS = 700;
const SPARK_COUNT = 26;
const NOISE_AMP = 0.32;
const EMBER_PX = 3.2;
const CHAR_PX = 16;

// ─── Shader ────────────────────────────────────────────────────────────────
const SKSL = `
uniform shader image;
uniform float2 cardOrigin;
uniform float2 cardSize;
uniform float progress;
uniform float time;
uniform float mode;      // 0 = ignition points, 1 = all edges
uniform float count;
uniform float2 o0;
uniform float2 o1;
uniform float2 o2;
uniform float2 o3;
uniform float invNorm;   // 1 / (length that maps to burnValue 1)
uniform float noiseAmp;

const float EMBER = ${EMBER_PX.toFixed(1)};
const float CHARW = ${CHAR_PX.toFixed(1)};

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + float2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// Normalised burn value at card-local point q (px).
float field(float2 q) {
  float d;
  if (mode > 0.5) {
    d = min(min(q.x, cardSize.x - q.x), min(q.y, cardSize.y - q.y));
  } else {
    d = distance(q, o0);
    if (count > 1.5) { d = min(d, distance(q, o1)); }
    if (count > 2.5) { d = min(d, distance(q, o2)); }
    if (count > 3.5) { d = min(d, distance(q, o3)); }
  }
  float n = fbm(q * 0.016) + 0.35 * fbm(q * 0.065 + float2(7.0, 3.0));
  return d * invNorm + (n - 0.66) * noiseAmp;
}

bool inside(float2 q) {
  return q.x >= 0.0 && q.y >= 0.0 && q.x <= cardSize.x && q.y <= cardSize.y;
}

half4 main(float2 pos) {
  float2 q = pos - cardOrigin;
  float lo = -noiseAmp * 0.5 - 0.04;
  float hi = 1.0 + noiseAmp * 0.45 + (EMBER + CHARW) * invNorm;
  float th = mix(lo, hi, progress);

  float4 col = float4(0.0);
  float u = 100000.0; // signed px distance to the front (+ = unburnt paper)

  if (inside(q)) {
    u = (field(q) - th) / invNorm;
    if (u >= 0.0) {
      float4 paper = float4(image.eval(pos));
      if (u < EMBER) {
        // 2. ember line — bright core fading to deep orange
        float k = u / EMBER;
        float3 c = mix(float3(1.0, 0.827, 0.42), float3(1.0, 0.541, 0.122), smoothstep(0.0, 0.55, k));
        c = mix(c, float3(0.761, 0.255, 0.047), smoothstep(0.55, 1.0, k));
        col = float4(c, 1.0);
      } else if (u < EMBER + CHARW) {
        // 1. char zone — near-black at the front, toasted brown, then paper
        float k = (u - EMBER) / CHARW;
        float3 charC = mix(float3(0.071, 0.031, 0.016), float3(0.227, 0.122, 0.059), smoothstep(0.0, 0.55, k));
        float3 base = paper.a > 0.001 ? paper.rgb / paper.a : float3(1.0);
        float3 c = mix(charC, base, smoothstep(0.5, 1.0, k));
        float a = mix(1.0, paper.a, smoothstep(0.5, 1.0, k));
        col = float4(c * a, a);
      } else {
        // slight toasting just ahead of the char
        float warm = 1.0 - smoothstep(EMBER + CHARW, EMBER + CHARW + 22.0, u);
        col = float4(paper.rgb * mix(float3(1.0), float3(0.86, 0.7, 0.55), warm * 0.55), paper.a);
      }
    } else {
      // burnt: transparent, with a soft ember bloom and a fading smoky shadow
      float b = -u;
      float glow = exp(-b / 4.5) * 0.85;
      float smoke = (1.0 - smoothstep(0.0, 28.0, b)) * 0.22;
      float3 rgb = float3(1.0, 0.48, 0.1) * glow + float3(0.06, 0.045, 0.04) * smoke;
      col = float4(rgb, max(glow, smoke));
    }
  }

  // 3. flames — always lick upward from the ember line, flickering with time
  if (u < 46.0) {
    float flame = 0.0;
    for (int i = 1; i <= 5; i++) {
      float s = float(i) * 6.0;
      float2 qq = q + float2(0.0, s);
      if (inside(qq)) {
        float uu = (field(qq) - th) / invNorm;
        if (uu >= -1.0 && uu < EMBER + 3.0) {
          flame = max(flame, 1.0 - s / 34.0);
        }
      }
    }
    if (flame > 0.0 && progress > 0.0 && progress < 1.0) {
      float n = vnoise(float2(q.x * 0.085, q.y * 0.06 + time * 7.0));
      float n2 = vnoise(float2(q.x * 0.21 + 13.0, q.y * 0.13 + time * 11.0));
      float f = flame * smoothstep(0.38, 0.85, n * 0.7 + n2 * 0.45);
      float3 fc = mix(float3(1.0, 0.36, 0.06), float3(1.0, 0.86, 0.45), f);
      // additive over whatever is below
      col = float4(col.rgb + fc * f, min(1.0, col.a + f * 0.85));
    }
  }
  return half4(col);
}
`;

const burnEffect = Skia.RuntimeEffect.Make(SKSL);

// ─── Origin helpers ────────────────────────────────────────────────────────
const NAMED: Record<string, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 1, y: 0 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-right": { x: 1, y: 1 },
  top: { x: 0.5, y: 0 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
  right: { x: 1, y: 0.5 },
};
const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"];

const resolveOrigin = (origin: BurnOrigin): { edges: boolean; points: { x: number; y: number }[] } => {
  if (origin === "edges") return { edges: true, points: [] };
  if (origin === "random") {
    // one or two random corners / edge points
    const first = CORNERS[Math.floor(Math.random() * 4)];
    const pts = [NAMED[first]];
    if (Math.random() < 0.4) {
      const others = CORNERS.filter((c) => c !== first);
      pts.push(NAMED[others[Math.floor(Math.random() * others.length)]]);
    }
    return { edges: false, points: pts };
  }
  const list = Array.isArray(origin) ? origin : [origin];
  const points = list
    .map((p) => (typeof p === "string" ? NAMED[p] : p))
    .filter(Boolean)
    .slice(0, 4) as { x: number; y: number }[];
  return { edges: false, points: points.length ? points : [NAMED["bottom-right"]] };
};

// Progress curve: slow catch, then accelerating.
const EASE_POWER = 1.8;

type Spark = {
  x: number;
  y: number;
  start: number; // ms
  life: number;
  rise: number;
  drift: number;
  r: number;
  color: string;
};

const SPARK_COLORS = ["#FFD36B", "#FFB347", "#FF8A1F", "#FFE6A3"];

// ─── Spark (Skia circle driven by the shared clock) ────────────────────────
const SparkDot = ({ spark, elapsed }: { spark: Spark; elapsed: SharedValue<number> }) => {
  const k = useDerivedValue(() => {
    const t = (elapsed.value - spark.start) / spark.life;
    return t < 0 ? -1 : Math.min(t, 1);
  });
  const cx = useDerivedValue(() => spark.x + spark.drift * Math.max(k.value, 0));
  const cy = useDerivedValue(() => spark.y - spark.rise * Math.max(k.value, 0));
  const opacity = useDerivedValue(() => {
    const v = k.value;
    if (v < 0 || v >= 1) return 0;
    return v < 0.15 ? v / 0.15 : 1 - (v - 0.15) / 0.85;
  });
  const r = useDerivedValue(() => spark.r * (1 - Math.max(k.value, 0) * 0.6));
  return (
    <Circle cx={cx} cy={cy} r={r} color={spark.color} opacity={opacity} blendMode="plus">
      <BlurMask blur={2.2} style="solid" />
    </Circle>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────
export const BurnCard = ({
  burning,
  origin = "random",
  duration = 1700,
  onBurnComplete,
  children,
}: BurnCardProps) => {
  const viewRef = useRef<View>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const [fallback, setFallback] = useState(false);
  const started = useRef(false);
  const elapsed = useSharedValue(0);
  const fade = useRef(new RNAnimated.Value(1)).current;
  const char = useRef(new RNAnimated.Value(0)).current;

  const plan = useMemo(() => {
    if (!size) return null;
    const { w, h } = size;
    const { edges, points } = resolveOrigin(origin);
    const px = points.map((p) => ({ x: p.x * w, y: p.y * h }));
    // Normalise so the farthest unburnt point reaches burnValue ≈ 1.
    let maxD = edges ? Math.min(w, h) / 2 : 0;
    if (!edges) {
      for (let gx = 0; gx <= 8; gx++) {
        for (let gy = 0; gy <= 8; gy++) {
          const x = (gx / 8) * w;
          const y = (gy / 8) * h;
          const d = Math.min(...px.map((o) => Math.hypot(x - o.x, y - o.y)));
          maxD = Math.max(maxD, d);
        }
      }
    }
    const invNorm = 1 / Math.max(maxD, 1);

    // Sparks spawn where the (noise-free) front passes.
    const lo = -NOISE_AMP * 0.5 - 0.04; // must match the shader
    const hi = 1 + NOISE_AMP * 0.45 + (EMBER_PX + CHAR_PX) * invNorm;
    const sparks: Spark[] = Array.from({ length: SPARK_COUNT }).map(() => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const d = edges
        ? Math.min(x, w - x, y, h - y)
        : Math.min(...px.map((o) => Math.hypot(x - o.x, y - o.y)));
      const p = Math.min(Math.max((d * invNorm - lo) / (hi - lo), 0), 1);
      const t = Math.pow(p, 1 / EASE_POWER);
      return {
        x: x + PAD.x,
        y: y + PAD.top,
        start: t * duration,
        life: 550 + Math.random() * 650,
        rise: 28 + Math.random() * 70,
        drift: (Math.random() - 0.5) * 44,
        r: 1.2 + Math.random() * 1.8,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      };
    });

    const o = [0, 1, 2, 3].map((i) => px[i] ?? px[0] ?? { x: 0, y: 0 });
    return { edges, count: Math.max(px.length, 1), o, invNorm, sparks };
  }, [size, origin, duration]);

  const uniforms = useDerivedValue(() => {
    const t = Math.min(elapsed.value / duration, 1);
    const p = Math.pow(t, EASE_POWER);
    return {
      cardOrigin: [PAD.x, PAD.top],
      cardSize: [size?.w ?? 1, size?.h ?? 1],
      progress: p,
      time: elapsed.value / 1000,
      mode: plan?.edges ? 1 : 0,
      count: plan?.count ?? 1,
      o0: [plan?.o[0].x ?? 0, plan?.o[0].y ?? 0],
      o1: [plan?.o[1].x ?? 0, plan?.o[1].y ?? 0],
      o2: [plan?.o[2].x ?? 0, plan?.o[2].y ?? 0],
      o3: [plan?.o[3].x ?? 0, plan?.o[3].y ?? 0],
      invNorm: plan?.invNorm ?? 1,
      noiseAmp: NOISE_AMP,
    };
  }, [plan, size, duration]);

  const finish = () => onBurnComplete?.();

  const runFallback = () => {
    setFallback(true);
    RNAnimated.sequence([
      RNAnimated.timing(char, { toValue: 1, duration: 180, useNativeDriver: true }),
      RNAnimated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => finish());
  };

  useEffect(() => {
    if (!burning || !size || started.current) return;
    started.current = true;
    (async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (reduceMotion || !burnEffect) {
        runFallback();
        return;
      }
      try {
        const image = await makeImageFromView(viewRef as React.RefObject<View>);
        if (!image) throw new Error("snapshot failed");
        setSnapshot(image);
        elapsed.value = 0;
        elapsed.value = withTiming(
          duration + TAIL_MS,
          { duration: duration + TAIL_MS, easing: Easing.linear },
          (done) => {
            if (done) runOnJS(finish)();
          }
        );
      } catch {
        runFallback();
      }
    })();
  }, [burning, size]);

  const showCanvas = !!snapshot && !!size && !!plan && !!burnEffect;

  return (
    <View
      onLayout={(e) => {
        if (started.current) return; // freeze size once burning
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: width, h: height });
      }}
    >
      {/* The live card. Hidden (not unmounted) once the burn canvas takes over. */}
      <RNAnimated.View style={{ opacity: showCanvas ? 0 : fade }}>
        <View ref={viewRef} collapsable={false}>
          {children}
        </View>
        {fallback && (
          <RNAnimated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.charOverlay, { opacity: char }]}
          />
        )}
      </RNAnimated.View>

      {showCanvas && (
        <Canvas
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -PAD.x,
            top: -PAD.top,
            width: size!.w + PAD.x * 2,
            height: size!.h + PAD.top + PAD.bottom,
          }}
        >
          <Rect x={0} y={0} width={size!.w + PAD.x * 2} height={size!.h + PAD.top + PAD.bottom}>
            <Shader source={burnEffect!} uniforms={uniforms}>
              <ImageShader
                image={snapshot}
                fit="fill"
                rect={{ x: PAD.x, y: PAD.top, width: size!.w, height: size!.h }}
              />
            </Shader>
          </Rect>
          <Group>
            {plan!.sparks.map((s, i) => (
              <SparkDot key={i} spark={s} elapsed={elapsed} />
            ))}
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  charOverlay: {
    backgroundColor: "#1a0d06",
    borderRadius: 18,
  },
});
