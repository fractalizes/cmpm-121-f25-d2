import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <h1>Title!</h1>
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
  <canvas id="canvas"><canvas>
`;

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.width = 256;
canvas.height = 256;
