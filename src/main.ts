import "./style.css";

document.body.innerHTML = `
  <h1>Doodle Thing!</h1>
  <canvas id="canvas"></canvas>
  <br><br>edit:
  <button id="clear">clear</button>
  <button id="undo">undo</button>
  <button id="redo">redo</button>
  <br>marker:
  <button id="thin">thin</button>
  <button id="thick">thick</button>
  <br>stickers:
  <button id="stickerA">🤯</button>
  <button id="stickerB">😭</button>
  <button id="stickerC">✨</button>

`;

interface Renderable {
  display(ctx: CanvasRenderingContext2D): void;
}

class CursorCommand implements Renderable {
  private x: number;
  private y: number;
  private icon: string;
  private width: number;

  constructor(x: number, y: number, icon: string, width: number) {
    this.x = x;
    this.y = y;
    this.icon = icon;
    this.width = width;
  }

  display(ctx: CanvasRenderingContext2D): void {
    const thin: boolean = this.width == 1;
    ctx.font = (thin ? "16" : "24") + "px monospace";
    ctx.fillText(this.icon, this.x - (thin ? 4 : 6), this.y - (thin ? 0 : 2));
  }
}

class MarkerCommand implements Renderable {
  private path: { x: number; y: number }[];
  private width: number;

  constructor(x: number, y: number, width: number) {
    this.path = [{ x, y }];
    this.width = width;
  }

  drag(x: number, y: number) {
    this.path.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.path.length < 1) return;
    ctx.beginPath();
    ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      const start = this.path[i - 1];
      const end = this.path[i];

      ctx.beginPath();
      ctx.lineWidth = this.width;
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    ctx.stroke();
  }
}

/*
class StickerCommand implements Renderable {
  private x: number;
  private y: number;
  private button: HTMLButtonElement;

  constructor(x: number, y: number, button: HTMLButtonElement) {
    this.x = x;
    this.y = y;
    this.button = button;
  }
  display(ctx: CanvasRenderingContext2D): void {
  }
}
*/

interface Sticker {
  icon: string;
  button: HTMLButtonElement;
}

let isDrawing: boolean = false;

// edit buttons
const clear = document.getElementById("clear")! as HTMLButtonElement;
const undo = document.getElementById("undo")! as HTMLButtonElement;
const redo = document.getElementById("redo")! as HTMLButtonElement;

// marker buttons
const thin = document.getElementById("thin")! as HTMLButtonElement;
const thick = document.getElementById("thick")! as HTMLButtonElement;
thin.disabled = true;

// sticker icons
const stickerA: Sticker = {
  icon: "🤯",
  button: document.getElementById("stickerA")! as HTMLButtonElement,
};
const stickerB: Sticker = {
  icon: "😭",
  button: document.getElementById("stickerB")! as HTMLButtonElement,
};
const stickerC: Sticker = {
  icon: "✨",
  button: document.getElementById("stickerC")! as HTMLButtonElement,
};
const stickers = [stickerA, stickerB, stickerC];

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.style.cursor = "none";
canvas.width = 256;
canvas.height = 256;

const ctx = canvas.getContext("2d")!;

const lines: MarkerCommand[] = [];
const redoLines: MarkerCommand[] = [];
let currentLine: MarkerCommand | null = null;

let cursor: CursorCommand | null = null;

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    line.display(ctx);
  }
  cursor?.display(ctx);
}

canvas.addEventListener("mouseenter", (mouse) => {
  cursor = new CursorCommand(
    mouse.offsetX,
    mouse.offsetY,
    thin.disabled || thick.disabled ? "🖊️" : "hi", // TODO
    thin.disabled ? 1 : 2,
  );
  notify("tool-moved");
});

canvas.addEventListener("mouseout", () => {
  cursor = null;
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (mouse) => {
  if (isDrawing) {
    currentLine!.drag(mouse.offsetX, mouse.offsetY);
    notify("drawing-changed");
  }
  cursor = new CursorCommand(
    mouse.offsetX,
    mouse.offsetY,
    thin.disabled || thick.disabled ? "🖊️" : "hi", // TODO
    thin.disabled ? 1 : 2,
  );
  notify("tool-moved");
});

canvas.addEventListener("mousedown", (mouse) => {
  isDrawing = true;

  currentLine = new MarkerCommand(
    mouse.offsetX,
    mouse.offsetY,
    thin.disabled ? 1 : 3,
  );
  lines.push(currentLine);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentLine = null;
  notify("drawing-changed");
});

clear.addEventListener("mousedown", () => {
  lines.splice(0, lines.length);
  notify("drawing-changed");
});

undo.addEventListener("mousedown", () => {
  if (lines.length > 0) {
    redoLines.push(lines.pop()!);
    notify("drawing-changed");
  }
});

redo.addEventListener("mousedown", () => {
  if (redoLines.length > 0) {
    lines.push(redoLines.pop()!);
    notify("drawing-changed");
  }
});

thin.addEventListener("mousedown", () => {
  if (!thin.disabled) {
    thin.disabled = true;
    thick.disabled = false;
  }
  stickers.forEach((sticker) => sticker.button.disabled = false);
});

thick.addEventListener("mousedown", () => {
  if (!thick.disabled) {
    thick.disabled = true;
    thin.disabled = false;
  }
  stickers.forEach((sticker) => sticker.button.disabled = false);
});

stickers.forEach((sticker) => {
  sticker.button.addEventListener("mousedown", () => {
    thin.disabled = false;
    thick.disabled = false;

    // re-enable sticker buttons
    stickers.forEach((s) => {
      s.button.disabled = false;
    });

    sticker.button.disabled = true;
  });
});
