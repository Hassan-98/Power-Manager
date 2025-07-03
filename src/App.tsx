import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import './App.css'

interface PowerPlan {
  guid: string
  name: string
  is_active: boolean
}

interface AppRule {
  id: string
  app_name: string
  executable_path: string
  power_plan_guid: string
  enabled: boolean
}

interface PowerManagerConfig {
  idle_power_plan?: string
  default_power_plan?: string
  app_rules: AppRule[]
}

// Check if we're running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
}

function App() {
  const [powerPlans, setPowerPlans] = useState<PowerPlan[]>([])
  const [appRules, setAppRules] = useState<AppRule[]>([])
  const [processNames, setProcessNames] = useState<string[]>([])
  const [config, setConfig] = useState<PowerManagerConfig>({ app_rules: [] })
  const [loading, setLoading] = useState(true)
  const [isElectronApp] = useState(isElectron())
  const [startupEnabled, setStartupEnabled] = useState(false)

  // Form states
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AppRule>>({
    app_name: '',
    executable_path: '',
    power_plan_guid: '',
    enabled: true
  })

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPowerPlans = useCallback(async () => {
    if (isElectronApp && window.electronAPI) {
      try {
        const plans = await window.electronAPI.getPowerPlans();
        setPowerPlans(plans);
      } catch (err) {
        console.error('Failed to load power plans:', err);
      }
    }
  }, [isElectronApp]);

  // Listen for power plan changes from the backend
  useEffect(() => {
    if (isElectronApp && window.electronAPI) {
      // Listen for power plan changes
      const handlePowerPlanChanged = () => {
        console.log('Power plan changed, refreshing...');
        // Refresh only the power plans, not all data
        loadPowerPlans();
      };

      // Listen for rule applications
      const handleRuleApplied = (_event: Event, rule: AppRule) => {
        console.log('Rule applied:', rule);
        const planName = powerPlans.find(p => p.guid === rule.power_plan_guid)?.name || 'unknown power plan';
        toast.success(`Rule applied: ${rule.app_name} activated ${planName}`);
      };

      // Listen for refresh requests from tray
      const handleRefreshPowerPlans = () => {
        console.log('Refresh requested from tray');
        loadPowerPlans();
      };

      window.electronAPI.onPowerPlanChanged(handlePowerPlanChanged);
      window.electronAPI.onRuleApplied(handleRuleApplied);
      window.electronAPI.onRefreshPowerPlans(handleRefreshPowerPlans);

      // Cleanup listeners on component unmount
      return () => {
        window.electronAPI.removeAllListeners('power-plan-changed');
        window.electronAPI.removeAllListeners('rule-applied');
        window.electronAPI.removeAllListeners('refresh-power-plans');
      };
    }
  }, [isElectronApp, powerPlans, loadPowerPlans]); // Include loadPowerPlans in dependencies

  const loadData = async () => {
    try {
      setLoading(true)

      if (isElectronApp && window.electronAPI) {
        const [plans, cfg, processes, startup] = await Promise.all([
          window.electronAPI.getPowerPlans(),
          window.electronAPI.getConfig(),
          window.electronAPI.getProcessNames(),
          window.electronAPI.getStartupEnabled()
        ])

        setPowerPlans(plans)
        setConfig(cfg)
        setAppRules(cfg.app_rules)
        setProcessNames(processes.sort())
        setStartupEnabled(startup)
      } else {
        // Fallback mock data for development
        const mockPlans = [
          { guid: "381b4222-f694-41f0-9685-ff5bb260df2e", name: "Balanced", is_active: true },
          { guid: "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", name: "High performance", is_active: false },
          { guid: "a1841308-3541-4fab-bc81-f71556f20b4a", name: "Power saver", is_active: false }
        ]
        const mockProcesses = ["chrome.exe", "firefox.exe", "notepad.exe", "code.exe", "steam.exe"]

        setPowerPlans(mockPlans)
        setProcessNames(mockProcesses)
        setStartupEnabled(false)
      }
    } catch (err) {
      toast.error(`Failed to load data: ${err}`)
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetActivePowerPlan = async (planGuid: string) => {
    try {
      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.setActivePowerPlan(planGuid)
        await loadData()
        const planName = powerPlans.find(p => p.guid === planGuid)?.name
        toast.success(`Power plan switched to ${planName}`)
      } else {
        toast.info(`Demo Mode: Would set active power plan to ${powerPlans.find(p => p.guid === planGuid)?.name}`)
      }
    } catch (err) {
      toast.error(`Failed to set power plan: ${err}`)
    }
  }

  const handleAddRule = async () => {
    if (!newRule.app_name || !newRule.power_plan_guid) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const rule: AppRule = {
        id: Date.now().toString(),
        app_name: newRule.app_name,
        executable_path: newRule.executable_path || '',
        power_plan_guid: newRule.power_plan_guid,
        enabled: newRule.enabled ?? true
      }

      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.addAppRule(rule)
        await loadData()
        toast.success(`Rule added for ${rule.app_name}`)
      } else {
        // Demo mode
        setAppRules([...appRules, rule])
        setConfig(prev => ({ ...prev, app_rules: [...prev.app_rules, rule] }))
        toast.success(`Demo: Rule added for ${rule.app_name}`)
      }

      setShowAddRule(false)
      setNewRule({ app_name: '', executable_path: '', power_plan_guid: '', enabled: true })
    } catch (err) {
      toast.error(`Failed to add rule: ${err}`)
    }
  }

  const handleRemoveRule = async (ruleId: string) => {
    try {
      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.removeAppRule(ruleId)
        await loadData()
        toast.success('Rule removed successfully')
      } else {
        // Demo mode
        const updatedRules = appRules.filter(rule => rule.id !== ruleId)
        setAppRules(updatedRules)
        setConfig(prev => ({ ...prev, app_rules: updatedRules }))
        toast.success('Demo: Rule removed')
      }
    } catch (err) {
      toast.error(`Failed to remove rule: ${err}`)
    }
  }

  const handleToggleRule = async (rule: AppRule) => {
    try {
      const updatedRule = { ...rule, enabled: !rule.enabled }

      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.updateAppRule(updatedRule)
        await loadData()
        toast.success(`Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} for ${rule.app_name}`)
      } else {
        // Demo mode
        const updatedRules = appRules.map(r => r.id === rule.id ? updatedRule : r)
        setAppRules(updatedRules)
        setConfig(prev => ({ ...prev, app_rules: updatedRules }))
        toast.success(`Demo: Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} for ${rule.app_name}`)
      }
    } catch (err) {
      toast.error(`Failed to toggle rule: ${err}`)
    }
  }

  const handleUpdateIdlePowerPlan = async (planGuid: string) => {
    try {
      const updatedConfig = { ...config, idle_power_plan: planGuid }

      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.updateConfig(updatedConfig)
        await loadData()
        toast.success('Idle power plan updated')
      } else {
        // Demo mode
        setConfig(updatedConfig)
        toast.success('Demo: Idle power plan updated')
      }
    } catch (err) {
      toast.error(`Failed to update idle power plan: ${err}`)
    }
  }

  const handleUpdateDefaultPowerPlan = async (planGuid: string) => {
    try {
      const updatedConfig = { ...config, default_power_plan: planGuid }

      if (isElectronApp && window.electronAPI) {
        await window.electronAPI.updateConfig(updatedConfig)
        await loadData()
        toast.success('Default power plan updated')
      } else {
        // Demo mode
        setConfig(updatedConfig)
        toast.success('Demo: Default power plan updated')
      }
    } catch (err) {
      toast.error(`Failed to update default power plan: ${err}`)
    }
  }

  const handleTestRules = async () => {
    try {
      if (isElectronApp && window.electronAPI) {
        const result = await window.electronAPI.checkAndApplyRules()
        if (result.success) {
          toast.info(result.appliedRule ?
            `Rule applied: ${result.appliedRule.app_name} -> Power plan changed` :
            'No matching rules found, default plan applied (if configured)'
          )
        }
      } else {
        toast.warning('Rule testing only available in Electron mode')
      }
    } catch (err) {
      toast.error(`Failed to test rules: ${err}`)
    }
  }

  const handleToggleStartup = async () => {
    try {
      if (isElectronApp && window.electronAPI) {
        const newStatus = !startupEnabled
        const result = await window.electronAPI.setStartupEnabled(newStatus)
        if (result.success) {
          setStartupEnabled(result.enabled)
          toast.success(`Startup ${result.enabled ? 'enabled' : 'disabled'} successfully`)
        }
      } else {
        toast.warning('Startup setting only available in Electron mode')
      }
    } catch (err) {
      toast.error(`Failed to toggle startup setting: ${err}`)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔋 PowerManager - Power Plan Manager</h1>
        <p>Automatically manage Windows power plans based on running applications</p>
        {!isElectronApp && (
          <div className="demo-banner">
            <strong>Demo Mode</strong> - Running in browser mode with mock data
          </div>
        )}
      </header>

      <div className="main-content">
        {/* Current Power Plans */}
        <section className="section">
          <h2>Power Plans</h2>
          <div className="power-plans-grid">
            {powerPlans.map((plan) => (
              <div key={plan.guid} className={`power-plan-card ${plan.is_active ? 'active' : ''}`}>
                <h3>{plan.name}</h3>
                <p className="guid">GUID: {plan.guid}</p>
                {plan.is_active ? (
                  <span className="status active">Currently Active</span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSetActivePowerPlan(plan.guid)}
                  >
                    Activate {!isElectronApp && '(Demo)'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Global Settings */}
        <section className="section">
          <h2>Global Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Run on Windows Startup:</label>
              <div className="startup-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={startupEnabled}
                    onChange={handleToggleStartup}
                    disabled={!isElectronApp}
                  />
                  <span className="slider"></span>
                </label>
                <span className="startup-status">
                  {startupEnabled ? 'Enabled' : 'Disabled'}
                  {!isElectronApp && ' (Demo Mode)'}
                </span>
              </div>
            </div>
            <div className="setting-item">
              <label>Power Plan When Idle:</label>
              <select
                value={config.idle_power_plan || ''}
                onChange={(e) => handleUpdateIdlePowerPlan(e.target.value)}
              >
                <option value="">None</option>
                {powerPlans.map(plan => (
                  <option key={plan.guid} value={plan.guid}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div className="setting-item">
              <label>Default Power Plan:</label>
              <select
                value={config.default_power_plan || ''}
                onChange={(e) => handleUpdateDefaultPowerPlan(e.target.value)}
              >
                <option value="">None</option>
                {powerPlans.map(plan => (
                  <option key={plan.guid} value={plan.guid}>{plan.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Application Rules */}
        <section className="section">
          <div className="section-header">
            <h2>Application Rules</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddRule(true)}
            >
              + Add Rule
            </button>
          </div>

          {/* Add Rule Form */}
          {showAddRule && (
            <div className="add-rule-form">
              <h3>Add New Application Rule</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Application Name:</label>
                  <select
                    value={newRule.app_name || ''}
                    onChange={(e) => setNewRule({ ...newRule, app_name: e.target.value })}
                  >
                    <option value="">Select Application</option>
                    {processNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Executable Path (Optional):</label>
                  <input
                    type="text"
                    value={newRule.executable_path || ''}
                    onChange={(e) => setNewRule({ ...newRule, executable_path: e.target.value })}
                    placeholder="C:\Program Files\..."
                  />
                </div>
                <div className="form-group">
                  <label>Power Plan:</label>
                  <select
                    value={newRule.power_plan_guid || ''}
                    onChange={(e) => setNewRule({ ...newRule, power_plan_guid: e.target.value })}
                  >
                    <option value="">Select Power Plan</option>
                    {powerPlans.map(plan => (
                      <option key={plan.guid} value={plan.guid}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleAddRule}>
                  Add Rule
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAddRule(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rules List */}
          <div className="rules-list">
            {appRules.length === 0 ? (
              <p className="no-rules">No application rules configured yet.</p>
            ) : (
              appRules.map((rule) => (
                <div key={rule.id} className={`rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="rule-info">
                    <h4>{rule.app_name}</h4>
                    <p>Power Plan: {powerPlans.find(p => p.guid === rule.power_plan_guid)?.name || 'Unknown'}</p>
                    {rule.executable_path && <p className="exe-path">Path: {rule.executable_path}</p>}
                  </div>
                  <div className="rule-actions">
                    <button
                      className={`btn ${rule.enabled ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleRule(rule)}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRemoveRule(rule.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <footer className="app-footer">
        <button className="btn btn-secondary" onClick={loadData}>
          🔄 Refresh
        </button>
        {isElectronApp && (
          <button className="btn btn-primary" onClick={handleTestRules}>
            ⚡ Test Rules
          </button>
        )}
        <p>
          {isElectronApp ? (
            'PowerManager is running in full Electron mode'
          ) : (
            'Running in demo mode - build with Electron for full functionality'
          )}
        </p>
      </footer>
    </div>
  )
}

export default App
