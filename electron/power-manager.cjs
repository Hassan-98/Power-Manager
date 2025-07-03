const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class PowerManager {
  constructor() {
    this.configPath = path.join(os.homedir(), 'AppData', 'Local', 'PowerManager', 'config.json');
    this.config = {
      idle_power_plan: null,
      default_power_plan: null,
      app_rules: []
    };
    this.loadConfig();
  }

  async getPowerPlans() {
    try {
      const { stdout } = await execAsync('powercfg /list');
      const lines = stdout.split('\n');
      const plans = [];

      // Get active power plan GUID
      const { stdout: activeStdout } = await execAsync('powercfg /getactivescheme');
      const activeMatch = activeStdout.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      const activeGuid = activeMatch ? activeMatch[1].toLowerCase() : null;

      for (const line of lines) {
        const match = line.match(/Power Scheme GUID: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+\((.+?)\)/i);
        if (match) {
          const guid = match[1].toLowerCase();
          const name = match[2].trim();
          plans.push({
            guid,
            name,
            is_active: guid === activeGuid
          });
        }
      }
      return plans;
    } catch (error) {
      console.error('Error getting power plans:', error);
      // Return mock data if PowerShell fails
      return [
        { guid: "381b4222-f694-41f0-9685-ff5bb260df2e", name: "Balanced", is_active: true },
        { guid: "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", name: "High performance", is_active: false },
        { guid: "a1841308-3541-4fab-bc81-f71556f20b4a", name: "Power saver", is_active: false }
      ];
    }
  }

  async setActivePowerPlan(planGuid) {
    try {
      await execAsync(`powercfg /setactive ${planGuid}`);
      console.log(`Power plan changed to: ${planGuid}`);
      return { success: true };
    } catch (error) {
      console.error('Error setting power plan:', error);
      throw new Error(`Failed to set power plan: ${error.message}`);
    }
  }

  async getConfig() {
    return this.config;
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    return this.config;
  }

  async addAppRule(rule) {
    rule.id = rule.id || Date.now().toString();
    this.config.app_rules.push(rule);
    await this.saveConfig();
    return rule;
  }

  async removeAppRule(ruleId) {
    this.config.app_rules = this.config.app_rules.filter(rule => rule.id !== ruleId);
    await this.saveConfig();
    return { success: true };
  }

  async updateAppRule(updatedRule) {
    const index = this.config.app_rules.findIndex(rule => rule.id === updatedRule.id);
    if (index !== -1) {
      this.config.app_rules[index] = updatedRule;
      await this.saveConfig();
      return updatedRule;
    }
    throw new Error('Rule not found');
  }

  async loadConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch (error) {
      // Config file doesn't exist or is invalid, use defaults
      console.log('Using default configuration');
    }
  }

  async saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Check and apply rules based on running processes
  async checkAndApplyRules(runningProcesses) {
    const processNames = runningProcesses.map(p => p.name.toLowerCase());
    console.log('Checking rules for processes:', processNames);
    console.log('Available rules:', this.config.app_rules);

    // Find the highest priority rule that matches
    let matchedRule = null;
    for (const rule of this.config.app_rules) {
      if (rule.enabled && processNames.includes(rule.app_name.toLowerCase())) {
        console.log(`Found matching rule: ${rule.app_name} -> ${rule.power_plan_guid}`);
        matchedRule = rule;
        break; // Apply the first matching rule
      }
    }

    if (matchedRule) {
      try {
        await this.setActivePowerPlan(matchedRule.power_plan_guid);
        console.log(`Applied rule: ${matchedRule.app_name} -> ${matchedRule.power_plan_guid}`);
        return matchedRule;
      } catch (error) {
        console.error(`Error applying rule for ${matchedRule.app_name}:`, error);
      }
    } else {
      console.log('No matching rules found');
      // If no rules matched and we have a default plan, switch to it
      if (this.config.default_power_plan) {
        try {
          await this.setActivePowerPlan(this.config.default_power_plan);
          console.log(`Applied default power plan: ${this.config.default_power_plan}`);
        } catch (error) {
          console.error('Error applying default power plan:', error);
        }
      }
    }

    return null;
  }
}

module.exports = { PowerManager };
