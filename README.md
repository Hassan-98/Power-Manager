# PowerManager - Power Plan Manager

![PowerManager](https://img.shields.io/badge/Platform-Windows-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Electron](https://img.shields.io/badge/Built%20with-Electron-9feaf9)
![React](https://img.shields.io/badge/Frontend-React-61dafb)

A modern, intelligent Windows power plan management application that automatically switches power plans based on running applications. Built with Electron, React, and Node.js.

## 🚀 Features

### Core Functionality

- **Automatic Power Plan Switching**: Automatically changes Windows power plans when specific applications are detected
- **Real-time Process Monitoring**: Continuously monitors running processes and applies rules instantly
- **Manual Power Plan Control**: Switch between power plans with a single click
- **System Tray Integration**: Minimizes to system tray for background operation
- **Single Instance Application**: Prevents multiple instances from running simultaneously
- **Windows Startup Support**: Optional setting to run PowerManager on Windows startup

### Smart Rule System

- **Application-based Rules**: Create rules that trigger when specific applications are running
- **Priority-based Rule Application**: First matching rule takes precedence
- **Default Power Plan**: Fallback to a default power plan when no rules match
- **Rule Management**: Enable/disable rules individually without deleting them

### User Interface

- **Modern, Clean Design**: Intuitive interface with modern styling and smooth animations
- **Real-time Updates**: UI automatically refreshes when power plans change
- **Fixed Window Size**: Optimized 1024x768 window for consistent experience
- **Dark/Light Theme Support**: Adapts to system preferences

### Advanced Features

- **Configuration Persistence**: All settings and rules are saved automatically
- **Process Detection**: Lists all running processes for easy rule creation
- **Tray Notifications**: Get notified when rules are applied or power plans change
- **Background Operation**: Continues working when minimized to tray

## 📋 Requirements

- **Operating System**: Windows 10/11
- **Node.js**: Version 16 or higher
- **Administrator Privileges**: Required for power plan management

## 🛠️ Installation

### Build from Source

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Hassan-98/Power-Manager.git
   cd powermanager
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build application UI**:

   ```bash
   npm run build
   ```

4. **Run in development mode**:

   ```bash
   npm run electron:dev
   ```

5. **Build executable**:
   ```bash
   npm run electron:build
   ```

## 🎯 How to Use

### Getting Started

1. **Launch PowerManager** - The app will appear in your system tray
2. **Configure Startup** - Optionally enable "Run on Windows Startup" in Global Settings
3. **View Power Plans** - See all available Windows power plans with current status
4. **Create Rules** - Set up automatic switching based on running applications
5. **Configure Defaults** - Set default and idle power plans

### Creating Application Rules

1. Click **"+ Add Rule"** in the Application Rules section
2. **Select Application**: Choose from the dropdown of currently running processes
3. **Choose Power Plan**: Select which power plan to activate
4. **Optional Path**: Specify exact executable path for precision
5. Click **"Add Rule"** to save

### Managing Power Plans

- **Active Plan**: Shows with green highlight and active indicator
- **Manual Switch**: Click "Activate" on any plan to switch immediately
- **Real-time Updates**: UI refreshes automatically when plans change

### System Tray Features

- **Single Click**: Hide/Show main window
- **Double Click**: Restore main window
- **Right Click**: Context menu with options:
  - Show PowerManager
  - Refresh Plans
  - Quit Application
- **Single Instance**: If you try to launch PowerManager while it's already running, it will show the existing window instead of creating a new instance

### Configuration Options

- **Default Power Plan**: Applied when no application rules match
- **Idle Power Plan**: Reserved for future idle detection feature
- **Rule Priority**: Rules are checked in order, first match wins
- **Windows Startup**: Configure whether PowerManager starts with Windows

## 🔧 Configuration

### File Locations

- **Configuration**: `%LOCALAPPDATA%\PowerManager\config.json`
- **Application Data**: Stored in user's AppData folder
- **Logs**: Console output in development mode

### Configuration Structure

```json
{
  "default_power_plan": "guid-of-default-plan",
  "idle_power_plan": "guid-of-idle-plan",
  "app_rules": [
    {
      "id": "unique-rule-id",
      "app_name": "chrome.exe",
      "executable_path": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "power_plan_guid": "guid-of-target-plan",
      "enabled": true
    }
  ]
}
```

## 🎮 Use Cases

### Gaming

Create rules to automatically switch to "High Performance" when games launch:

- **Steam Games**: Add rules for specific game executables
- **Epic Games**: Monitor EpicGamesLauncher.exe
- **Origin/EA**: Add origin.exe or EA Desktop rules

### Development

Optimize power for development tools:

- **Visual Studio Code**: High performance for large projects
- **IDEs**: JetBrains tools, Visual Studio
- **Browsers**: Chrome/Firefox for web development

### Content Creation

Power management for creative applications:

- **Video Editing**: Premiere Pro, DaVinci Resolve
- **3D Modeling**: Blender, Maya, 3ds Max
- **Photo Editing**: Photoshop, GIMP

### Office Work

Battery optimization for productivity:

- **Office Suite**: Word, Excel, PowerPoint
- **Communication**: Teams, Slack, Zoom
- **Browsers**: Edge, Chrome for web apps

## 🛡️ Troubleshooting

### Common Issues

**Power plans not switching**:

- Ensure PowerManager is running as Administrator
- Check if the application name matches exactly
- Verify the power plan GUID is correct

**App not appearing in system tray**:

- Check Windows tray settings
- Restart PowerManager
- Verify tray icon permissions

**Rules not triggering**:

- Check if the process name is correct (case-sensitive)
- Ensure the rule is enabled
- Verify the application is actually running

**UI not updating**:

- Click the "Refresh" button
- Check console for errors in development mode
- Restart the application

### Performance Tips

- **Limit Rules**: Too many rules can impact performance
- **Specific Paths**: Use executable paths for better accuracy
- **Regular Cleanup**: Remove unused rules periodically

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally on your machine
- **No Telemetry**: No data collection or external communication
- **Administrator Access**: Required only for power plan management
- **Open Source**: Full source code available for inspection

## 🛠️ Development

### Tech Stack

- **Frontend**: React 19 with TypeScript
- **Backend**: Node.js with Electron
- **Styling**: Custom CSS with modern design system
- **Process Monitoring**: systeminformation package
- **Power Management**: Windows powercfg command-line tool

### Project Structure

```
powermanager/
├── electron/           # Electron main process
│   ├── main.cjs       # Main electron process
│   ├── preload.cjs    # Preload script
│   ├── power-manager.cjs  # Power plan management
│   └── process-monitor.cjs # Process monitoring
├── src/               # React frontend
│   ├── App.tsx        # Main React component
│   ├── App.css        # Styling
│   └── types/         # TypeScript definitions
├── dist/              # Built frontend
└── package.json       # Dependencies and scripts
```

### Building & Testing

```bash
# Development mode
npm run dev              # Start Vite dev server
npm run electron:dev     # Run Electron in dev mode

# Production build
npm run build           # Build React app
npm run electron        # Run Electron with built app
npm run electron:build  # Create distributable
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues**: Report bugs on [GitHub Issues](../../issues)
- **Features**: Request features on [GitHub Discussions](../../discussions)
- **Documentation**: Check this README and code comments

## 🎖️ Acknowledgments

- **Electron Team**: For the fantastic cross-platform framework
- **React Team**: For the amazing UI library
- **Community**: For inspiration and feedback

---

**PowerManager** - Intelligent Power Management for Windows
Made with ❤️ for the Windows users by [Hassan Ali](https://hassanali.tk)
