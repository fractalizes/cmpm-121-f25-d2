import "./style.css";

document.body.innerHTML = `
  <h1>Doodle Thing!</h1>
  <canvas id="canvas"></canvas>
  <br><br>
  <button id="clear">clear</button>
`;

let isDrawing: boolean = false;
let x: number = 0;
let y: number = 0;

const clear = document.getElementById("clear")! as HTMLButtonElement;
const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.width = 256;
canvas.height = 256;

const ctx = canvas.getContext("2d")!;

const lines: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] | null = null;

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

canvas.addEventListener("mousedown", (mouse) => {
  x = mouse.offsetX;
  y = mouse.offsetY;
  isDrawing = true;

  currentLine = [];
  lines.push(currentLine);
  currentLine.push({ x: x, y: y });
});

canvas.addEventListener("mousemove", (mouse) => {
  if (isDrawing) {
    x = mouse.offsetX;
    y = mouse.offsetY;
    currentLine?.push({ x: x, y: y });
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
}

clear.addEventListener("mousedown", () => {
  lines.splice(0, lines.length);
  notify("drawing-changed");
});
