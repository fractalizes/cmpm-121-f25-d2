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

canvas.addEventListener("mousedown", (mouse) => {
  x = mouse.offsetX;
  y = mouse.offsetY;

  isDrawing = true;
});

canvas.addEventListener("mousemove", (mouse) => {
  if (isDrawing) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(mouse.offsetX, mouse.offsetY);
    ctx.stroke();

    x = mouse.offsetX;
    y = mouse.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    isDrawing = false;
  }
});

clear.addEventListener("mousedown", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
