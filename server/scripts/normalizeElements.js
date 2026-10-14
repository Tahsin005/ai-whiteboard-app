/**
 * normalizeElements.js
 * One-off migration script that rewrites existing database element rows to the canonical schema.
 */
import { pool, query } from "../src/config/db.js";

const VALID_TYPES = [
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

const CANONICAL_DEFAULTS = {
  rect: { w: 140, h: 90, stroke: "#6366f1", fill: "transparent", strokeWidth: 2, radius: 8, text: "", fontSize: 16 },
  ellipse: { w: 140, h: 90, stroke: "#6366f1", fill: "transparent", strokeWidth: 2, text: "", fontSize: 16 },
  diamond: { w: 140, h: 90, stroke: "#6366f1", fill: "transparent", strokeWidth: 2, text: "", fontSize: 16 },
  line: { stroke: "#6366f1", strokeWidth: 3 },
  arrow: { stroke: "#6366f1", strokeWidth: 3, endArrow: true, startArrow: false },
  draw: { stroke: "#6366f1", size: 4, thinning: 0.5, smoothing: 0.5, streamline: 0.5, simulatePressure: true, points: [] },
  sticky: { w: 180, h: 180, fill: "#fef08a", text: "", fontSize: 16 },
  text: { w: 220, h: 40, color: "#1e293b", text: "", fontSize: 18 },
  bullet: { w: 260, h: 44, text: "", checked: false, fill: "transparent", stroke: "#6366f1", fontSize: 16 },
  image: { w: 240, h: 240, src: "", naturalW: 240, naturalH: 240, text: "" },
  chart: { w: 320, h: 220, chartType: "bar", title: "Sales Overview", labels: ["Q1", "Q2", "Q3", "Q4"], values: [35, 60, 45, 80], colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6"] },
  emoji: { w: 64, h: 64, emoji: "😀" },
};

function normalizeElementData(type = "sticky", raw = {}) {
  const d = raw || {};
  const def = CANONICAL_DEFAULTS[type] || {};

  const x = d.x ?? d.X ?? 0;
  const y = d.y ?? d.Y ?? 0;
  const w = d.w ?? d.W ?? d.width ?? def.w ?? 140;
  const h = d.h ?? d.H ?? d.height ?? def.h ?? 90;
  const text = d.text ?? d.content ?? d.label ?? def.text ?? "";
  const fontSize = d.fontSize ?? def.fontSize ?? 16;

  switch (type) {
    case "line":
    case "arrow": {
      const startX = d.startX ?? x;
      const startY = d.startY ?? y;
      const endX = d.endX ?? (startX + (d.w ?? 120));
      const endY = d.endY ?? (startY + (d.h ?? 60));
      const stroke = d.stroke ?? d.color ?? d.borderColor ?? def.stroke;
      const strokeWidth = d.strokeWidth ?? d.size ?? def.strokeWidth;
      const base = { ...d, startX, startY, endX, endY, stroke, strokeWidth };
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
      const simulatePressure = d.simulatePressure !== undefined ? Boolean(d.simulatePressure) : true;
      return { ...d, points, stroke, size, thinning, smoothing, streamline, simulatePressure };
    }
    case "text": {
      const color = d.color ?? d.fill ?? d.stroke ?? def.color;
      return { ...d, x, y, w: d.w ?? d.W ?? d.width ?? def.w, h: d.h ?? d.H ?? d.height ?? def.h, color, text, fontSize };
    }
    case "sticky": {
      const fill = d.fill ?? d.backgroundColor ?? d.color ?? def.fill;
      return { ...d, x, y, w, h, fill, text, fontSize };
    }
    case "rect":
    case "ellipse":
    case "diamond": {
      const stroke = d.stroke ?? d.borderColor ?? def.stroke;
      const fill = d.fill ?? d.backgroundColor ?? (d.color && d.color !== stroke ? d.color : def.fill);
      const strokeWidth = d.strokeWidth ?? def.strokeWidth;
      const res = { ...d, x, y, w, h, stroke, fill, strokeWidth, text, fontSize };
      if (type === "rect") res.radius = d.radius ?? def.radius;
      return res;
    }
    case "bullet": {
      const fill = d.fill ?? d.backgroundColor ?? def.fill;
      const stroke = d.stroke ?? d.borderColor ?? def.stroke;
      const checked = Boolean(d.checked ?? false);
      return { ...d, x, y, w, h, text, checked, fill, stroke, fontSize };
    }
    case "image": {
      return { ...d, x, y, w, h, src: d.src ?? "", naturalW: d.naturalW ?? d.naturalWidth ?? def.naturalW, naturalH: d.naturalH ?? d.naturalHeight ?? def.naturalH, text: d.text ?? d.alt ?? "" };
    }
    case "chart": {
      return { ...d, x, y, w, h, chartType: d.chartType ?? def.chartType, title: d.title ?? def.title, labels: Array.isArray(d.labels) ? d.labels : def.labels, values: Array.isArray(d.values) ? d.values : def.values, colors: Array.isArray(d.colors) ? d.colors : def.colors };
    }
    case "emoji": {
      return { ...d, x, y, w, h, emoji: d.emoji ?? def.emoji };
    }
    default:
      return { ...d, x, y, w, h, text };
  }
}

async function runMigration() {
  console.log("Starting normalizeElements migration...");
  try {
    const { rows } = await query("SELECT id, type, data, z FROM elements");
    console.log(`Found ${rows.length} elements to inspect.`);

    let updatedCount = 0;
    for (const row of rows) {
      const currentData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      const canonicalData = normalizeElementData(row.type, currentData);
      const currentJson = JSON.stringify(currentData);
      const canonicalJson = JSON.stringify(canonicalData);

      if (currentJson !== canonicalJson) {
        await query(
          "UPDATE elements SET data = $1 WHERE id = $2",
          [JSON.stringify(canonicalData), row.id]
        );
        updatedCount++;
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} / ${rows.length} elements.`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
