// MiniOps - Linux System Monitoring Dashboard

const $ = (id) => document.getElementById(id);

function formatBytes(bytes) {
    if (bytes == null || !Number.isFinite(Number(bytes))) {
        return "--";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = Number(bytes);
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    return `${value.toFixed(2)} ${units[index]}`;
}

function setMetric(id, value, suffix = "") {
    const element = $(id);

    if (element && value != null && Number.isFinite(Number(value))) {
        element.textContent = `${Number(value).toFixed(1)}${suffix}`;
    }
}

function setProgress(id, value) {
    const element = $(id);

    if (element && value != null && Number.isFinite(Number(value))) {
        element.value = Math.max(0, Math.min(100, Number(value)));
    }
}

async function loadMetrics() {
    try {
        const response = await fetch("/api/metrics", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Metrics API returned ${response.status}`);
        }

        const data = await response.json();

        // CPU: support both "cpu" and "cpu_percent"
        const cpu = data.cpu_percent ?? data.cpu;

        // RAM: support nested and flat API formats
        const ramPercent = data.ram?.percent ?? data.ram_percent;
        const ramUsed = data.ram?.used ?? data.ram_used_gb;
        const ramTotal = data.ram?.total ?? data.ram_total_gb;

        // Disk: support nested and flat API formats
        const diskPercent = data.disk?.percent ?? data.disk_percent;
        const diskFree = data.disk?.free ?? data.disk_free_gb;
        const diskTotal = data.disk?.total ?? data.disk_total_gb;

        setMetric("cpu", cpu);
        setProgress("cpuBar", cpu);

        setMetric("ram", ramPercent);
        updateCharts();
        setProgress("ramBar", ramPercent);

        if (ramUsed != null && ramTotal != null) {
            $("ramDetails").textContent =
                `${Number(ramUsed).toFixed(2)} GB used of ${Number(ramTotal).toFixed(2)} GB`;
        }

        setMetric("disk", diskPercent);
        setProgress("diskBar", diskPercent);

        if (diskFree != null && diskTotal != null) {
            $("diskDetails").textContent =
                `${Number(diskFree).toFixed(2)} GB free of ${Number(diskTotal).toFixed(2)} GB`;
        }

        // Network traffic counters
        const sent = data.network?.bytes_sent ?? data.network_sent_bytes;
        const received = data.network?.bytes_recv ?? data.network_received_bytes;

        if (sent != null) {
            $("sent").textContent = formatBytes(sent);
        }

        if (received != null) {
            $("received").textContent = formatBytes(received);
        }
        // Live Network Upload/Download Speed
const uploadSpeed = data.network?.upload_speed;
const downloadSpeed = data.network?.download_speed;

if (uploadSpeed != null) {
    $("uploadSpeed").textContent =
        formatBytes(uploadSpeed) + "/s";
}

if (downloadSpeed != null) {
    $("downloadSpeed").textContent =
        formatBytes(downloadSpeed) + "/s";
}

        $("status").textContent = "Connected";
        $("updated").textContent = data.timestamp
            ? new Date(data.timestamp.replace(" ", "T")).toLocaleString()
            : new Date().toLocaleTimeString();

    } catch (error) {
        console.error("MiniOps metrics error:", error);
        $("status").textContent = "Connection error";
    }
}

async function loadProcesses() {
    try {
        const response = await fetch("/api/processes", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Processes API returned ${response.status}`);
        }

        const result = await response.json();

        const processes = Array.isArray(result)
            ? result
            : (result.processes ?? result.data ?? []);

        const table = $("processTable");
        table.replaceChildren();

        if (!Array.isArray(processes) || processes.length === 0) {
            table.innerHTML =
                '<tr><td colspan="3">No process data available</td></tr>';
            return;
        }

        processes.forEach((process) => {
            const row = document.createElement("tr");

            const pid = process.pid ?? process.PID ?? "--";
            const name = process.name ?? process.process_name ?? "--";

            const memory =
                process.memory_mb ??
                process.memory_usage_mb ??
                process.memory_percent ??
                process.memory;

            const memoryText = memory == null
                ? "--"
                : `${Number(memory).toFixed(2)}${process.memory_percent != null ? "%" : " MB"}`;

            [pid, name, memoryText].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            table.appendChild(row);
        });

    } catch (error) {
        console.error("MiniOps processes error:", error);

        $("processTable").innerHTML =
            '<tr><td colspan="3">Unable to load processes</td></tr>';
    }
}

async function refreshDashboard() {
    await Promise.all([
        loadMetrics(),
        loadProcesses()
    ]);
}

refreshDashboard();

// Refresh metrics and process information every 3 seconds.
setInterval(refreshDashboard, 3000);

// MiniOps Live Performance Charts

const chartLabels = [];
const cpuHistory = [];
const ramHistory = [];

let cpuChart = null;
let ramChart = null;

function initializeCharts() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js library not loaded");
        return;
    }

    const commonOptions = {
        responsive: true,
        animation: false,
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: {
                    color: "#94a3b8"
                },
                grid: {
                    color: "#334155"
                }
            },
            x: {
                ticks: {
                    color: "#94a3b8"
                },
                grid: {
                    color: "#334155"
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: "#e2e8f0"
                }
            }
        }
    };

    cpuChart = new Chart($("cpuChart"), {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "CPU Usage %",
                data: cpuHistory,
                borderColor: "#38bdf8",
                tension: 0.3
            }]
        },
        options: commonOptions
    });

    ramChart = new Chart($("ramChart"), {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "RAM Usage %",
                data: ramHistory,
                borderColor: "#4ade80",
                tension: 0.3
            }]
        },
        options: commonOptions
    });
}

function updateCharts() {
    if (!cpuChart || !ramChart) return;

    const cpu = Number($("cpu").textContent);
    const ram = Number($("ram").textContent);

    if (!Number.isFinite(cpu) || !Number.isFinite(ram)) return;

    chartLabels.push(new Date().toLocaleTimeString());
    cpuHistory.push(cpu);
    ramHistory.push(ram);

    if (chartLabels.length > 20) {
        chartLabels.shift();
        cpuHistory.shift();
        ramHistory.shift();
    }

    cpuChart.update("none");
    ramChart.update("none");
}

initializeCharts();

