const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Power Plan Management
  getPowerPlans: () => ipcRenderer.invoke('get-power-plans'),
  setActivePowerPlan: (planGuid) => ipcRenderer.invoke('set-active-power-plan', planGuid),

  // Process Monitoring
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  getProcessNames: () => ipcRenderer.invoke('get-process-names'),
  isProcessRunning: (processName) => ipcRenderer.invoke('is-process-running', processName),

  // Configuration Management
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),

  // App Rules Management
  addAppRule: (rule) => ipcRenderer.invoke('add-app-rule', rule),
  removeAppRule: (ruleId) => ipcRenderer.invoke('remove-app-rule', ruleId),
  updateAppRule: (rule) => ipcRenderer.invoke('update-app-rule', rule),
  checkAndApplyRules: () => ipcRenderer.invoke('check-and-apply-rules'),

  // Startup Management
  getStartupEnabled: () => ipcRenderer.invoke('get-startup-enabled'),
  setStartupEnabled: (enabled) => ipcRenderer.invoke('set-startup-enabled', enabled),

  // Utility
  platform: process.platform,

  // Event listeners
  onRuleApplied: (callback) => ipcRenderer.on('rule-applied', callback),
  onPowerPlanChanged: (callback) => ipcRenderer.on('power-plan-changed', callback),
  onRefreshPowerPlans: (callback) => ipcRenderer.on('refresh-power-plans', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
