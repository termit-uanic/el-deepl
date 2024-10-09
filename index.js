const {
    app, BrowserWindow, Menu, Tray, nativeImage
} = require('electron')

let gShortcut;

import Store from 'electron-store';
const store = new Store();

var appQuitting = false;
const appName = 'el-deepl';

app.setAboutPanelOptions({
    applicationName: appName, applicationVersion: app.getVersion(), copyright: '© 2024 termit'
})


app.whenReady().then(() => {

    // isRemoveLineBreaks = store.get('remove_line_breaks');
    // isHiddenOnStartup = store.get('hidden_on_startup');
    // windowWidth = store.get('window_width');
    // windowHeight = store.get('window_height');

    isRemoveLineBreaks = false;
    isHiddenOnStartup = false;
    windowWidth = 800;
    windowHeight = 1024;


    // ## Build menu

    let templateArr = [// { role: 'settingsMenu' }
        {
            label: "Settings", submenu: [{
                label: "Shortcut", click: () => {
                    const hotkeySettingsWindow = new BrowserWindow({
                        frame: false, height: 50, width: 280, webPreferences: {
                            nodeIntegration: true, enableRemoteModule: true
                        }
                    })
                    hotkeySettingsWindow.loadFile('assets/hotkey.html')
                }
            }, {
                label: "Window size", click: () => {
                    const settingsWindowSize = new BrowserWindow({
                        frame: false, height: 125, width: 200, webPreferences: {
                            nodeIntegration: true, enableRemoteModule: true
                        }
                    })
                    settingsWindowSize.loadFile('assets/window-size.html')
                }
            }, {
                label: "Remove Line Breaks", type: "checkbox", checked: isRemoveLineBreaks, click: (item) => {
                    isRemoveLineBreaks = item.checked;
                    store.set('remove_line_breaks', isRemoveLineBreaks);
                    win.webContents.send('translateClipboard', item.checked);
                }
            }, {
                label: "Hidden on startup", type: "checkbox", checked: isHiddenOnStartup, click: (item) => {
                    isHiddenOnStartup = item.checked;
                    store.set('hidden_on_startup', isHiddenOnStartup);
                }
            }, {
                label: "Quit", role: 'quit'
            }]
        }, // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [{role: 'reload'}, {role: 'forceReload'}, {role: 'toggleDevTools'}, {type: 'separator'}, {role: 'resetZoom'}, {role: 'zoomIn'}, {role: 'zoomOut'}, {type: 'separator'}, {role: 'togglefullscreen'}]
        }, // { role: 'helpMenu' }
        {
            label: "Help", submenu: [{
                label: "Learn More", click: async () => {
                    await shell.openExternal('https://github.com/termit-uanic/el-deepl')
                }
            }, {
                label: "About", click: async () => {
                    await app.showAboutPanel();
                }
            }]
        }];

    if (process.platform === 'darwin') {
        templateArr.unshift({
            label: ''
        })
    }
    let menu = Menu.buildFromTemplate(templateArr);
    Menu.setApplicationMenu(menu);

    // ## Build tray
    let tray = new Tray(nativeImage.createFromPath('assets/tray-icon.png'))
    const contextMenu = Menu.buildFromTemplate([{
        label: 'Quit', click() {
            appQuitting = true
            app.quit()
        }
    }])
    tray.setToolTip(appName)
    tray.setContextMenu(contextMenu)

    // ## Register shortcut
    let ss = store.get('short_key');
    if (!ss) {
        store.set('short_key', 'Control+Alt+D');
    }
    gShortcut = store.get('short_key');
    registerShortcut(gShortcut);

    // ## Run app
    const win = new BrowserWindow({title: appName, width: 800, height: 600})
    win.on('close', function (evt) {
        if (!appQuitting) {
            evt.preventDefault();
            win.hide();
        }
    });

    win.loadURL('https://deepl.com/translator')

    win.webContents.on('did-finish-load', () => {
        // Use default printing options
    })
    // win.webContents.openDevTools();

    app.on('will-quit', () => {
        globalShortcut.unregister(gShortcut);
    });

})

function registerShortcut(newShortcut, oldShortcut) {
    let shortcut = globalShortcut.register(newShortcut, () => {
        win.webContents.send('translateClipboard', isRemoveLineBreaks);
        win.show()
    });

    if (!shortcut) {
        messageBox("error", "Register shortcut fail", `You will not be able to use ${newShortcut}`);
        return false;
    }

    if (oldShortcut) {
        globalShortcut.unregister(oldShortcut);
    }
    gShortcut = newShortcut;
    return true;
}
