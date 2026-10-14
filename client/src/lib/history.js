/**
 * history.js
 * Operation-based undo/redo history manager.
 * Supports batch operations (create, update, delete) per entry.
 */

export function invertOp(op) {
  switch (op.t) {
    case "create":
      return { t: "delete", el: op.el };
    case "delete":
      return { t: "create", el: op.el };
    case "update":
      return {
        t: "update",
        id: op.id,
        before: op.after,
        after: op.before,
      };
    default:
      return op;
  }
}

export function invertEntry(entry) {
  if (!entry || !Array.isArray(entry.ops)) return { ops: [] };
  // Reverse order and invert each op
  return {
    ops: entry.ops.map(invertOp).reverse(),
  };
}

export class HistoryManager {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
  }

  push(entry) {
    if (!entry || !entry.ops || entry.ops.length === 0) return;
    this.undoStack.push(entry);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (!this.canUndo()) return null;
    const entry = this.undoStack.pop();
    const inverted = invertEntry(entry);
    this.redoStack.push(entry);
    return inverted;
  }

  redo() {
    if (!this.canRedo()) return null;
    const entry = this.redoStack.pop();
    this.undoStack.push(entry);
    return entry;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
