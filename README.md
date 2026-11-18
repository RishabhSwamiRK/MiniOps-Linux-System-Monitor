# MiniOps — Linux System Monitor

A real-time Linux system monitoring dashboard built using Python, Flask, and psutil.

## About the Project

MiniOps is a Linux system monitoring tool that helps users monitor system performance through a simple and interactive web dashboard.

## Features

- **CPU Monitoring** — Real-time CPU usage.
- **RAM Monitoring** — Memory usage and total RAM.
- **Disk Monitoring** — Disk usage and available storage.
- **Network Monitoring** — Upload and download speed.
- **Process Monitoring** — Displays top running processes.
- **Live Graphs** — CPU and RAM usage visualization.
- **Auto Refresh** — Dashboard updates automatically every 3 seconds.

## Tech Stack

- Python
- Flask
- psutil
- HTML5
- CSS3
- JavaScript
- Chart.js

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/RishabhSwamiRK/MiniOps-Linux-System-Monitor.git
   ```

2. Open the project folder:

   ```bash
   cd MiniOps-Linux-System-Monitor
   ```

3. Create a virtual environment:

   ```bash
   python3 -m venv venv
   ```

4. Activate it:

   ```bash
   source venv/bin/activate
   ```

5. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

6. Run the application:

   ```bash
   python3 app.py
   ```

7. Open in your browser:

   ```text
   http://127.0.0.1:5000
   ```

## Project Structure

```text
MiniOps/
├── app.py
├── requirements.txt
├── static/
│   ├── style.css
│   └── script.js
└── templates/
    └── index.html
```

## Project Status

**MVP Completed** — More features and improvements are planned.

## Author

**Rishabh Swami**

GitHub: [RishabhSwamiRK](https://github.com/RishabhSwamiRK)
