export interface PowerPlan {
  guid: string;
  name: string;
  is_active: boolean;
}

export interface AppRule {
  id: string;
  app_name: string;
  executable_path: string;
  power_plan_guid: string;
  enabled: boolean;
}

export interface PowerManagerConfig {
  idle_power_plan?: string;
  default_power_plan?: string;
  app_rules: AppRule[];
}

export interface ProcessInfo {
  pid: number;
  name: string;
  exe_path: string;
  cpu?: number;
  memory?: number;
}

export interface ElectronAPI {
  // Power Plan Management
  getPowerPlans: () => Promise<PowerPlan[]>;
  setActivePowerPlan: (planGuid: string) => Promise<{ success: boolean }>;

  // Process Monitoring
  getRunningProcesses: () => Promise<ProcessInfo[]>;
  getProcessNames: () => Promise<string[]>;
  isProcessRunning: (processName: string) => Promise<boolean>;

  // Configuration Management
  getConfig: () => Promise<PowerManagerConfig>;
  updateConfig: (config: PowerManagerConfig) => Promise<PowerManagerConfig>;

  // App Rules Management
  addAppRule: (rule: AppRule) => Promise<AppRule>;
  removeAppRule: (ruleId: string) => Promise<{ success: boolean }>;
  updateAppRule: (rule: AppRule) => Promise<AppRule>;
  checkAndApplyRules: () => Promise<{ success: boolean; appliedRule?: AppRule | null }>;

  // Startup Management
  getStartupEnabled: () => Promise<boolean>;
  setStartupEnabled: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;

  // Utility
  platform: string;

  // Event listeners
  onRuleApplied: (callback: (event: Event, rule: AppRule) => void) => void;
  onPowerPlanChanged: (callback: (event: Event) => void) => void;
  onRefreshPowerPlans: (callback: (event: Event) => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
