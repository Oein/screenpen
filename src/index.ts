import {
  BrowserWindow,
  app,
  screen,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
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
      show: false,
      hasShadow: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      enableLargerThanScreen: true,
      fullscreenable: false,
      kiosk: true,
      autoHideMenuBar: true,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
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
      screenshotDesktop({
        screen: display.id,
        format: "png",
      }).then((screenshot) => {
        let url = `data:image/png;base64,${screenshot.toString("base64")}`;
        windows[display.id].webContents.executeJavaScript(
          "image(`" + url + "`)"
        );
        windows[display.id].show();
      });
    });
  };

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Press "Ctrl + Shift + ."', type: "normal" },
    { label: "To draw on your screen", type: "normal" },
    { type: "separator" },
    { label: "Press ESC", type: "normal" },
    { label: "To exit from drawing mode", type: "normal" },
    { type: "separator" },
    { label: "Quit", type: "normal" },
  ]);
  const exitDisplay = () => {
    console.log("HIDE");
    windows.forEach((win) => {
      win.close();
    });
    windows = [];
    clearInterval(inter);
    showing = false;
  };
  tray.setContextMenu(contextMenu);
  contextMenu.items[0].click = openDispaly;
  contextMenu.items[1].click = openDispaly;
  contextMenu.items[6].click = () => {
    app.exit();
  };

  globalShortcut.register("Ctrl+Shift+.", openDispaly);
  globalShortcut.register("ESC", exitDisplay);
  ipcMain.handle("exit", exitDisplay);
});

app.on("window-all-closed", () => {});
