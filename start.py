import subprocess
import time
import sys
import os
import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def start_service(name, cmd, cwd, port=None):
    if port and is_port_in_use(port):
        print(f"[!] Warning: Port {port} is already in use. {name} might fail to start if it requires this port.")
    
    print(f"[*] Starting {name}...")
    try:
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            shell=True,
            env=os.environ.copy()
        )
        # Give it a second to fail fast
        time.sleep(2)
        if process.poll() is not None:
            print(f"[X] Failed to start {name}. Check logs in {cwd}")
            return None
        return process
    except Exception as e:
        print(f"[X] Failed to start {name}: {e}")
        return None

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # AI Model
    venv_python = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable
    
    ai_process = start_service(
        "AI Service",
        [python_exe, "app.py"],
        os.path.join(root_dir, "ai-model"),
        port=8000
    )
    
    # Server
    server_process = start_service(
        "Backend Server",
        "npm run dev",
        os.path.join(root_dir, "server"),
        port=5000
    )
    
    # Client
    client_process = start_service(
        "Frontend Client",
        "npm run dev",
        os.path.join(root_dir, "client"),
        port=5173
    )

    print("\n" + "="*50)
    print("--- AI Public Grievance System Status ---")
    print("="*50)
    print(f"Frontend: http://localhost:5173 {'[OK]' if client_process else '[FAIL]'}")
    print(f"Backend:  http://localhost:5000 {'[OK]' if server_process else '[FAIL]'}")
    print(f"AI API:   http://localhost:8000 {'[OK]' if ai_process else '[FAIL]'}")
    print("="*50)
    
    if not (ai_process and server_process and client_process):
        print("[!] Some services failed to start. Please check the errors above.")
    
    print("Press Ctrl+C to stop all services.\n")

    try:
        while True:
            # Poll processes
            services = [
                ("AI Service", ai_process),
                ("Backend Server", server_process),
                ("Frontend Client", client_process)
            ]
            for name, proc in services:
                if proc and proc.poll() is not None:
                    print(f"[!] Error: {name} stopped unexpectedly.")
                    # Mark it as dead so we don't spam
                    if name == "AI Service": ai_process = None
                    elif name == "Backend Server": server_process = None
                    elif name == "Frontend Client": client_process = None
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[*] Stopping all services...")
        if ai_process: ai_process.terminate()
        if server_process: server_process.terminate()
        if client_process: client_process.terminate()
        print("[Done]")

if __name__ == "__main__":
    main()
