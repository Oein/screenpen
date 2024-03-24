import {
  BrowserWindow,
  app,
  screen,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import path from "path";
import screenshotDesktop from "screenshot-desktop";

let staticFolder = path.join(__dirname, "..", "static");
let windows: BrowserWindow[] = [];

const createWindow = (x: number, y: number, width: number, height: number) => {
  windows.push(
    new BrowserWindow({
      x: x,
      y: y,
      show: true,
      hasShadow: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      enableLargerThanScreen: true,
      fullscreenable: false,
      fullscreen: false,
      kiosk: true,
      autoHideMenuBar: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
    })
  );

  const win = windows[windows.length - 1];

  win.on("ready-to-show", () => {
    win.setSize(width, height);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true);
  });

  win.on("show", () => {
    win.focus();
    win.focusOnWebView();
  });

  win.on("swipe", (e) => {
    e.preventDefault();
    win.show();
  });

  win.loadFile(path.join(staticFolder, "screen.html"));
};

let showing = false;
let inter: NodeJS.Timer;
let displays: {
  id: number;
  name: string;
}[];

app.whenReady().then(async () => {
  let screens = screen.getAllDisplays();

  const img = nativeImage.createFromPath(path.join(staticFolder, "icon.png"));
  const tray = new Tray(
    img.resize({
      width: 22,
      height: 22,
    })
  );

  const contextMenu = Menu.buildFromTemplate([
    { label: "Quit", type: "normal",click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);

  await (async () => {
    displays = await screenshotDesktop.listDisplays();
  })();

  const openDispaly = () => {
    if (showing) return;
    console.log("SHOW");
    showing = true;
    inter = setInterval(() => {
      app?.dock?.hide();
    }, 100);

    displays.forEach((display) => {
      let screenx = screens.filter((i) => i.id == display.id + 1)[0].bounds;
      createWindow(screenx.x, screenx.y, screenx.width, screenx.height);
    });
  };

  const exitDisplay = () => {
    console.log("HIDE");
    windows.forEach((win) => {
      win.close();
    });
    windows = [];
    clearInterval(inter);
    showing = false;
  };

  globalShortcut.register("Alt+Tab", openDispaly);
  globalShortcut.register("ESC", exitDisplay);
});

app.on("window-all-closed", () => {});
