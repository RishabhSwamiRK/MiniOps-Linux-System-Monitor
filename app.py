from flask import Flask, jsonify, render_template
import psutil
import time

app = Flask(__name__)

initial_network = psutil.net_io_counters()
previous_bytes_sent = initial_network.bytes_sent
previous_bytes_recv = initial_network.bytes_recv
previous_network_time = time.time()


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/metrics")
def get_metrics():
    global previous_network_time
    global previous_bytes_sent
    global previous_bytes_recv

    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    network = psutil.net_io_counters()

    current_time = time.time()
    elapsed = max(current_time - previous_network_time, 0.001)

    upload_speed = max(
        network.bytes_sent - previous_bytes_sent, 0
    ) / elapsed

    download_speed = max(
        network.bytes_recv - previous_bytes_recv, 0
    ) / elapsed

    previous_network_time = current_time
    previous_bytes_sent = network.bytes_sent
    previous_bytes_recv = network.bytes_recv

    data = {
        "cpu": psutil.cpu_percent(interval=0.2),
        "ram": {
            "percent": memory.percent,
            "used": round(memory.used / (1024 ** 3), 2),
            "total": round(memory.total / (1024 ** 3), 2)
        },
        "disk": {
            "percent": disk.percent,
            "free": round(disk.free / (1024 ** 3), 2),
            "total": round(disk.total / (1024 ** 3), 2)
        },
        "network": {
    "bytes_sent": network.bytes_sent,
    "bytes_recv": network.bytes_recv,
    "upload_speed": round(upload_speed, 2),
    "download_speed": round(download_speed, 2)
},
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    return jsonify(data)


@app.route("/api/processes")
def get_processes():
    processes = []

    for process in psutil.process_iter(
        ["pid", "name", "memory_percent"]
    ):
        try:
            processes.append(process.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(
        key=lambda p: p.get("memory_percent") or 0,
        reverse=True
    )

    return jsonify(processes[:20])


if __name__ == "__main__":
    app.run(debug=True)
