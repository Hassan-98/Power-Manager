const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const serve = require('electron-serve').default || require('electron-serve');
const { PowerManager } = require('./power-manager.cjs');
const { ProcessMonitor } = require('./process-monitor.cjs');

const loadURL = serve({ directory: 'dist' });

let mainWindow;
let tray;
let powerManager;
let processMonitor;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets', 'tray-icon.png'),
    title: 'PowerManager - Power Plan Manager',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    frame: true
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('minimize', (event) => {
    if (process.platform === 'win32') {
      event.preventDefault();
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
      // Show tray notification on first minimize
      if (tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'PowerManager',
          content: 'App was minimized to tray'
        });
      }
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
      // Show tray notification on first close
      if (tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'PowerManager',
          content: 'App is still running in the system tray. Right-click the tray icon to quit.'
        });
      }
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show PowerManager',
      click: () => {
        mainWindow.setSkipTaskbar(false);
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Power Plans',
      submenu: [
        {
          label: 'Refresh Plans',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('refresh-power-plans');
            }
          }
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit PowerManager',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('PowerManager - Power Plan Manager');

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.setSkipTaskbar(false);
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    mainWindow.setSkipTaskbar(false);
    mainWindow.show();
    mainWindow.focus();
  });
}

// Initialize power management and process monitoring
function initializeServices() {
  powerManager = new PowerManager();
  processMonitor = new ProcessMonitor();

  // Set up callbacks to apply rules when processes start/stop
  processMonitor.onProcessStarted(async (newProcesses) => {
    console.log('Checking rules for new processes:', newProcesses);
    try {
      const runningProcesses = await processMonitor.getRunningProcesses();
      const appliedRule = await powerManager.checkAndApplyRules(runningProcesses);
      if (appliedRule && mainWindow) {
        // Notify frontend that a rule was applied
        mainWindow.webContents.send('rule-applied', appliedRule);
        mainWindow.webContents.send('power-plan-changed');
      }
    } catch (error) {
      console.error('Error applying rules for new processes:', error);
    }
  });

  processMonitor.onProcessStopped(async (stoppedProcesses) => {
    console.log('Checking rules after processes stopped:', stoppedProcesses);
    try {
      const runningProcesses = await processMonitor.getRunningProcesses();
      const appliedRule = await powerManager.checkAndApplyRules(runningProcesses);
      if (appliedRule && mainWindow) {
        // Notify frontend that a rule was applied
        mainWindow.webContents.send('rule-applied', appliedRule);
        mainWindow.webContents.send('power-plan-changed');
      }
    } catch (error) {
      console.error('Error applying rules after processes stopped:', error);
    }
  });

  // Start monitoring processes
  processMonitor.startMonitoring();

  // Initial rule check
  setTimeout(async () => {
    try {
      const runningProcesses = await processMonitor.getRunningProcesses();
      await powerManager.checkAndApplyRules(runningProcesses);
    } catch (error) {
      console.error('Error in initial rule check:', error);
    }
  }, 2000); // Wait 2 seconds for system to stabilize
}

// IPC Handlers
ipcMain.handle('get-power-plans', async () => {
  try {
    return await powerManager.getPowerPlans();
  } catch (error) {
    console.error('Error getting power plans:', error);
    throw error;
  }
});

ipcMain.handle('set-active-power-plan', async (event, planGuid) => {
  try {
    const result = await powerManager.setActivePowerPlan(planGuid);
    // Notify frontend that power plan changed
    if (mainWindow) {
      mainWindow.webContents.send('power-plan-changed');
    }
    return result;
  } catch (error) {
    console.error('Error setting power plan:', error);
    throw error;
  }
});

ipcMain.handle('get-running-processes', async () => {
  try {
    return await processMonitor.getRunningProcesses();
  } catch (error) {
    console.error('Error getting processes:', error);
    throw error;
  }
});

ipcMain.handle('get-process-names', async () => {
  try {
    return await processMonitor.getProcessNames();
  } catch (error) {
    console.error('Error getting process names:', error);
    throw error;
  }
});

ipcMain.handle('is-process-running', async (event, processName) => {
  try {
    return await processMonitor.isProcessRunning(processName);
  } catch (error) {
    console.error('Error checking if process is running:', error);
    throw error;
  }
});

ipcMain.handle('get-config', async () => {
  try {
    return await powerManager.getConfig();
  } catch (error) {
    console.error('Error getting config:', error);
    throw error;
  }
});

ipcMain.handle('update-config', async (event, config) => {
  try {
    return await powerManager.updateConfig(config);
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
});

ipcMain.handle('add-app-rule', async (event, rule) => {
  try {
    return await powerManager.addAppRule(rule);
  } catch (error) {
    console.error('Error adding app rule:', error);
    throw error;
  }
});

ipcMain.handle('remove-app-rule', async (event, ruleId) => {
  try {
    return await powerManager.removeAppRule(ruleId);
  } catch (error) {
    console.error('Error removing app rule:', error);
    throw error;
  }
});

ipcMain.handle('update-app-rule', async (event, rule) => {
  try {
    return await powerManager.updateAppRule(rule);
  } catch (error) {
    console.error('Error updating app rule:', error);
    throw error;
  }
});

ipcMain.handle('check-and-apply-rules', async () => {
  try {
    const runningProcesses = await processMonitor.getRunningProcesses();
    const appliedRule = await powerManager.checkAndApplyRules(runningProcesses);
    // Notify frontend that power plan may have changed
    if (mainWindow) {
      mainWindow.webContents.send('power-plan-changed');
      if (appliedRule) {
        mainWindow.webContents.send('rule-applied', appliedRule);
      }
    }
    return { success: true, appliedRule };
  } catch (error) {
    console.error('Error checking and applying rules:', error);
    throw error;
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  initializeServices();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (processMonitor) {
    processMonitor.stopMonitoring();
  }
});

// Handle app updates
app.on('ready', () => {
  if (!isDev) {
    // Auto-updater logic can go here
  }
});
