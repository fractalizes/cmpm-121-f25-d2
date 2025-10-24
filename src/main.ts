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
  <button id="custom">(+)</button>
  <button id="sticker0">🤯</button>
  <button id="sticker1">😭</button>
  <button id="sticker2">✨</button>
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
    if (this.icon == "🖊️") {
      const thin: boolean = this.width == 1;
      ctx.font = (thin ? "16" : "24") + "px monospace";
    } else ctx.font = "36px monospace";

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

class StickerCommand implements Renderable {
  private x: number;
  private y: number;
  private icon: string;

  constructor(x: number, y: number, icon: string) {
    this.x = x;
    this.y = y;
    this.icon = icon;
  }

  drag(x: number, y: number) {
    // reposition sticker
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D): void {
    ctx.font = "36px monospace";
    ctx.fillText(this.icon, this.x - 4, this.y);
  }
}

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
const sticker0: Sticker = {
  icon: "🤯",
  button: document.getElementById("sticker0")! as HTMLButtonElement,
};
const sticker1: Sticker = {
  icon: "😭",
  button: document.getElementById("sticker1")! as HTMLButtonElement,
};
const sticker2: Sticker = {
  icon: "✨",
  button: document.getElementById("sticker2")! as HTMLButtonElement,
};
const stickers = [sticker0, sticker1, sticker2];
const custom = document.getElementById("custom")! as HTMLButtonElement;

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.style.cursor = "none";
canvas.width = 256;
canvas.height = 256;

const ctx = canvas.getContext("2d")!;

const actions: (MarkerCommand | StickerCommand)[] = [];
const redoActions: (MarkerCommand | StickerCommand)[] = [];
let currentAction: MarkerCommand | StickerCommand | null = null;

let cursor: CursorCommand | null = null;

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const action of actions) {
    action.display(ctx);
  }
  cursor?.display(ctx);
}

function stickerEvent(sticker: Sticker) {
  sticker.button.addEventListener("mousedown", () => {
    thin.disabled = false;
    thick.disabled = false;

    // re-enable sticker buttons
    stickers.forEach((s) => {
      s.button.disabled = false;
    });
    sticker.button.disabled = true;
  });
}

canvas.addEventListener("mouseenter", (mouse) => {
  let cursorIcon: string | null = null;
  if (thin.disabled || thick.disabled) {
    cursorIcon = "🖊️";
  } else {
    stickers.forEach((sticker) => {
      if (sticker.button.disabled) {
        cursorIcon = sticker.icon;
      }
    });
  }

  cursor = new CursorCommand(
    mouse.offsetX,
    mouse.offsetY,
    cursorIcon!,
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
    currentAction!.drag(mouse.offsetX, mouse.offsetY);
    notify("drawing-changed");
  }

  let cursorIcon: string | null = null;
  if (thin.disabled || thick.disabled) {
    cursorIcon = "🖊️";
  } else {
    stickers.forEach((sticker) => {
      if (sticker.button.disabled) {
        cursorIcon = sticker.icon;
      }
    });
  }

  cursor = new CursorCommand(
    mouse.offsetX,
    mouse.offsetY,
    cursorIcon!,
    thin.disabled ? 1 : 2,
  );
  notify("tool-moved");
});

canvas.addEventListener("mousedown", (mouse) => {
  if (thin.disabled || thick.disabled) {
    isDrawing = true;

    currentAction = new MarkerCommand(
      mouse.offsetX,
      mouse.offsetY,
      thin.disabled ? 1 : 3,
    );
  } else {
    let icon: string | null = null;
    stickers.forEach((sticker) => {
      if (sticker.button.disabled) icon = sticker.icon;
    });
    currentAction = new StickerCommand(
      mouse.offsetX,
      mouse.offsetY,
      icon!,
    );
  }
  actions.push(currentAction);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentAction = null;
  notify("drawing-changed");
});

clear.addEventListener("mousedown", () => {
  actions.splice(0, actions.length);
  notify("drawing-changed");
});

undo.addEventListener("mousedown", () => {
  if (actions.length > 0) {
    redoActions.push(actions.pop()!);
    notify("drawing-changed");
  }
});

redo.addEventListener("mousedown", () => {
  if (redoActions.length > 0) {
    actions.push(redoActions.pop()!);
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

custom.addEventListener("mousedown", () => {
  const stickerText = prompt(
    "Input your custom sticker:",
    "🧽",
  );
  // if the sticker is not null and no whitespace has been submitted
  if (stickerText !== null && stickerText.trim().length > 0) {
    const newStickerButton = document.createElement("button");
    newStickerButton.innerHTML = stickerText;
    newStickerButton.id = "customSticker" + stickers.length.toString();
    document.body.append(newStickerButton);
    document.body.append(" "); // create for spacing

    const newSticker: Sticker = {
      icon: stickerText,
      button: document.getElementById(
        newStickerButton.id,
      )! as HTMLButtonElement,
    };

    stickers.push(newSticker);
    stickerEvent(newSticker);
    alert("Your custom " + stickerText + " has been added!");
  } else alert("Custom sticker has been cancelled.");
});

stickers.forEach((sticker) => {
  stickerEvent(sticker);
});
