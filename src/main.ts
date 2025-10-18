import "./style.css";

document.body.innerHTML = `
  <h1>Doodle Thing!</h1>
  <canvas id="canvas"></canvas>
  <br><br>
  <button id="clear">clear</button>
  <button id="undo">undo</button>
  <button id="redo">redo</button>
`;

interface Renderable {
  display(ctx: CanvasRenderingContext2D): void;
}

class MarkerLine implements Renderable {
  private path: { x: number; y: number }[];

  constructor(x: number, y: number) {
    this.path = [{ x, y }];
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
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    ctx.stroke();
  }
}

let isDrawing: boolean = false;
let x: number = 0;
let y: number = 0;

const clear = document.getElementById("clear")! as HTMLButtonElement;
const undo = document.getElementById("undo")! as HTMLButtonElement;
const redo = document.getElementById("redo")! as HTMLButtonElement;

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.width = 256;
canvas.height = 256;

const ctx = canvas.getContext("2d")!;

const lines: MarkerLine[] = [];
const redoLines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

canvas.addEventListener("mousedown", (mouse) => {
  x = mouse.offsetX;
  y = mouse.offsetY;
  isDrawing = true;

  currentLine = new MarkerLine(x, y);
  lines.push(currentLine);
});

canvas.addEventListener("mousemove", (mouse) => {
  if (isDrawing) {
    x = mouse.offsetX;
    y = mouse.offsetY;
    currentLine!.drag(x, y);
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentLine = null;
  notify("drawing-changed");
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    line.display(ctx);
  }
  /*
  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  */
}

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
