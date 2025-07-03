const si = require('systeminformation');

class ProcessMonitor {
  constructor() {
    this.runningProcesses = [];
    this.monitoringInterval = null;
    this.intervalTime = 5000; // Check every 5 seconds
    this.lastProcessList = new Set();
    this.processStartedCallback = null;
    this.processStoppedCallback = null;
  }

  async getRunningProcesses() {
    try {
      const processes = await si.processes();
      this.runningProcesses = processes.list.map(proc => ({
        pid: proc.pid,
        name: proc.name,
        exe_path: proc.command || '',
        cpu: proc.cpu || 0,
        memory: proc.mem || 0
      }));

      return this.runningProcesses;
    } catch (error) {
      console.error('Error getting running processes:', error);
      return [];
    }
  }

  async getProcessNames() {
    try {
      await this.getRunningProcesses();
      const uniqueNames = [...new Set(this.runningProcesses.map(p => p.name))];
      return uniqueNames.sort();
    } catch (error) {
      console.error('Error getting process names:', error);
      return [];
    }
  }

  async isProcessRunning(processName) {
    try {
      await this.getRunningProcesses();
      return this.runningProcesses.some(p =>
        p.name.toLowerCase() === processName.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking if process is running:', error);
      return false;
    }
  }

  async getProcessesByName(processName) {
    try {
      await this.getRunningProcesses();
      return this.runningProcesses.filter(p =>
        p.name.toLowerCase() === processName.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting processes by name:', error);
      return [];
    }
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getRunningProcesses();

        // Get current process names
        const currentProcesses = new Set(this.runningProcesses.map(p => p.name.toLowerCase()));

        // Check for new processes
        const newProcesses = [...currentProcesses].filter(name => !this.lastProcessList.has(name));
        const stoppedProcesses = [...this.lastProcessList].filter(name => !currentProcesses.has(name));

        if (newProcesses.length > 0) {
          console.log('New processes detected:', newProcesses);
          if (this.processStartedCallback) {
            this.processStartedCallback(newProcesses);
          }
        }

        if (stoppedProcesses.length > 0) {
          console.log('Processes stopped:', stoppedProcesses);
          if (this.processStoppedCallback) {
            this.processStoppedCallback(stoppedProcesses);
          }
        }

        this.lastProcessList = currentProcesses;
      } catch (error) {
        console.error('Error in process monitoring:', error);
      }
    }, this.intervalTime);

    console.log('Process monitoring started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Process monitoring stopped');
    }
  }

  setMonitoringInterval(intervalMs) {
    this.intervalTime = intervalMs;
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  // Event callbacks that can be set by the power manager
  onProcessStarted(callback) {
    this.processStartedCallback = callback;
  }

  onProcessStopped(callback) {
    this.processStoppedCallback = callback;
  }

  // Get system information
  async getSystemInfo() {
    try {
      const [cpu, mem, os] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo()
      ]);

      return {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          speed: cpu.speed
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          arch: os.arch
        }
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return null;
    }
  }

  // Get current CPU and memory usage
  async getCurrentLoad() {
    try {
      const [cpuLoad, memLoad] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);

      return {
        cpu: cpuLoad.currentLoad,
        memory: {
          used: memLoad.used,
          total: memLoad.total,
          percentage: (memLoad.used / memLoad.total) * 100
        }
      };
    } catch (error) {
      console.error('Error getting current load:', error);
      return null;
    }
  }
}

module.exports = { ProcessMonitor };
