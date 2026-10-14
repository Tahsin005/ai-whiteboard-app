/**
 * canvasSchema.js
 * Canonical element schema, per-type defaults, and legacy alias normalizer.
 */

export const VALID_TYPES = [
  "text",
  "sticky",
  "rect",
  "ellipse",
  "diamond",
  "line",
  "arrow",
  "draw",
  "bullet",
  "image",
  "chart",
  "emoji",
];

export const CANONICAL_DEFAULTS = {
  rect: {
    w: 140,
    h: 90,
    stroke: "#6965db",
    fill: "transparent",
    strokeWidth: 2,
    radius: 8,
    text: "",
    fontSize: 16,
  },
  ellipse: {
    w: 140,
    h: 90,
    stroke: "#6965db",
    fill: "transparent",
    strokeWidth: 2,
    text: "",
    fontSize: 16,
  },
  diamond: {
    w: 140,
    h: 90,
    stroke: "#6965db",
    fill: "transparent",
    strokeWidth: 2,
    text: "",
    fontSize: 16,
  },
  line: {
    stroke: "#6965db",
    strokeWidth: 3,
  },
  arrow: {
    stroke: "#6965db",
    strokeWidth: 3,
    endArrow: true,
    startArrow: false,
  },
  draw: {
    stroke: "#6965db",
    size: 4,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
    points: [],
  },
  sticky: {
    w: 180,
    h: 180,
    fill: "#fef08a",
    text: "",
    fontSize: 16,
  },
  text: {
    w: 220,
    h: 40,
    color: "#1e293b",
    text: "",
    fontSize: 18,
  },
  bullet: {
    w: 260,
    h: 44,
    text: "",
    checked: false,
    fill: "transparent",
    stroke: "#6965db",
    fontSize: 16,
  },
  image: {
    w: 240,
    h: 240,
    src: "",
    naturalW: 240,
    naturalH: 240,
    text: "",
  },
  chart: {
    w: 320,
    h: 220,
    chartType: "bar",
    title: "Sales Overview",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [35, 60, 45, 80],
    colors: ["#6965db", "#845ef7", "#f06595", "#339af0"],
  },
  emoji: {
    w: 64,
    h: 64,
    emoji: "😀",
  },
};

export const TYPE_DEFAULTS = CANONICAL_DEFAULTS;

/**
 * Normalizes element data according to its type and canonical fields.
 * Resolves legacy aliases (X->x, Y->y, W/width->w, H/height->h, color->fill/stroke).
 * Crucially fixes bug #1: does not override color with a default stroke prematurely.
 */
export function normalizeElementData(type = "sticky", raw = {}) {
  const d = raw || {};
  const def = CANONICAL_DEFAULTS[type] || {};

  // Common position/dimension aliases
  const x = d.x ?? d.X ?? 0;
  const y = d.y ?? d.Y ?? 0;
  const w = d.w ?? d.W ?? d.width ?? def.w ?? 140;
  const h = d.h ?? d.H ?? d.height ?? def.h ?? 90;
  const text =
    d.text ??
    d.content ??
    d.label ??
    (Array.isArray(d.items) ? d.items.join("\n") : def.text) ??
    "";
  const fontSize = d.fontSize ?? def.fontSize ?? 16;

  switch (type) {
    case "line":
    case "arrow": {
      const startX = d.startX ?? x;
      const startY = d.startY ?? y;
      const endX = d.endX ?? (startX + (d.w ?? 120));
      const endY = d.endY ?? (startY + (d.h ?? 60));
      // Stroke resolution order: stroke -> color -> borderColor -> default
      const stroke = d.stroke ?? d.color ?? d.borderColor ?? def.stroke;
      const strokeWidth = d.strokeWidth ?? d.size ?? def.strokeWidth;
      const base = {
        ...d,
        startX,
        startY,
        endX,
        endY,
        stroke,
        strokeWidth,
      };
      if (type === "arrow") {
        base.endArrow = d.endArrow !== undefined ? Boolean(d.endArrow) : true;
        base.startArrow = d.startArrow !== undefined ? Boolean(d.startArrow) : false;
      }
      return base;
    }

    case "draw": {
      const points = Array.isArray(d.points) ? d.points : [];
      const stroke = d.stroke ?? d.color ?? d.borderColor ?? def.stroke;
      const size = d.size ?? d.strokeWidth ?? def.size;
      const thinning = d.thinning ?? def.thinning;
      const smoothing = d.smoothing ?? def.smoothing;
      const streamline = d.streamline ?? def.streamline;
      const simulatePressure =
        d.simulatePressure !== undefined ? Boolean(d.simulatePressure) : true;
      return {
        ...d,
        points,
        stroke,
        size,
        thinning,
        smoothing,
        streamline,
        simulatePressure,
      };
    }

    case "text": {
      const color = d.color ?? d.fill ?? d.stroke ?? def.color;
      return {
        ...d,
        x,
        y,
        w: d.w ?? d.W ?? d.width ?? def.w,
        h: d.h ?? d.H ?? d.height ?? def.h,
        color,
        text,
        fontSize,
      };
    }

    case "sticky": {
      const fill =
        d.fill && d.fill !== "transparent"
          ? d.fill
          : d.backgroundColor && d.backgroundColor !== "transparent"
          ? d.backgroundColor
          : d.stickyColor || def.fill || "#fef08a";
      return {
        ...d,
        x,
        y,
        w,
        h,
        fill,
        text,
        fontSize,
      };
    }

    case "rect":
    case "ellipse":
    case "diamond": {
      const stroke = d.stroke ?? d.borderColor ?? def.stroke;
      const fill = d.fill ?? d.backgroundColor ?? (d.color && d.color !== stroke ? d.color : def.fill);
      const strokeWidth = d.strokeWidth ?? def.strokeWidth;
      const res = {
        ...d,
        x,
        y,
        w,
        h,
        stroke,
        fill,
        strokeWidth,
        text,
        fontSize,
      };
      if (type === "rect") {
        res.radius = d.radius ?? def.radius;
      }
      return res;
    }

    case "bullet": {
      const fill = d.fill ?? d.backgroundColor ?? def.fill;
      const stroke = d.stroke ?? d.borderColor ?? def.stroke;
      const checked = Boolean(d.checked ?? false);
      return {
        ...d,
        x,
        y,
        w,
        h,
        text,
        checked,
        fill,
        stroke,
        fontSize,
      };
    }

    case "image": {
      const src = d.src ?? "";
      const naturalW = d.naturalW ?? d.naturalWidth ?? def.naturalW;
      const naturalH = d.naturalH ?? d.naturalHeight ?? def.naturalH;
      return {
        ...d,
        x,
        y,
        w,
        h,
        src,
        naturalW,
        naturalH,
        text: d.text ?? d.alt ?? "",
      };
    }

    case "chart": {
      const chartType = d.chartType ?? def.chartType;
      const title = d.title ?? def.title;
      const labels = Array.isArray(d.labels) ? d.labels : def.labels;
      const values = Array.isArray(d.values) ? d.values : def.values;
      const colors = Array.isArray(d.colors) ? d.colors : def.colors;
      return {
        ...d,
        x,
        y,
        w,
        h,
        chartType,
        title,
        labels,
        values,
        colors,
      };
    }

    case "emoji": {
      const emoji = d.emoji ?? def.emoji;
      return {
        ...d,
        x,
        y,
        w,
        h,
        emoji,
      };
    }

    default:
      return {
        ...d,
        x,
        y,
        w,
        h,
        text,
      };
  }
}

/**
 * Normalizes an entire element object with canonical data and z-index.
 */
export function normalizeElement(element) {
  if (!element) return null;
  const type = element.type || "sticky";
  const data = normalizeElementData(type, element.data);
  const z = typeof element.z === "number" ? element.z : (element.z ? Number(element.z) : 0);
  return {
    ...element,
    type,
    z,
    data,
  };
}

/**
 * Sorts elements by ascending z-index, using created_at and id as deterministic tie-breakers.
 */
export function sortElementsByZ(elements = []) {
  return [...elements].sort((a, b) => {
    const za = a.z ?? 0;
    const zb = b.z ?? 0;
    if (za !== zb) return za - zb;
    if (a.created_at && b.created_at && a.created_at !== b.created_at) {
      return a.created_at.localeCompare(b.created_at);
    }
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}
