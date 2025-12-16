import subprocess
import time
import os
import sys
import webbrowser
import signal

def run_command(command, cwd=None, background=False):
    print(f"🚀 Running: {command}")
    try:
        if background:
            return subprocess.Popen(command, shell=True, cwd=cwd)
        else:
            return subprocess.run(command, shell=True, cwd=cwd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running command: {command}")
        print(e)
        sys.exit(1)

def check_dependencies():
    print("🔍 Checking dependencies...")
    try:
        subprocess.run("node -v", shell=True, check=True, stdout=subprocess.DEVNULL)
        print("✅ Node.js found")
    except:
        print("❌ Node.js not found. Please install Node.js.")
        sys.exit(1)

def start_db():
    print("\n🐘 Setting up SQLite Database (outputs.db)...")
    try:
        run_command("node setup-db.js", cwd="backend")
    except:
        print("⚠️  Schema setup failed.")

def main():
    print("=======================================")
    print("   🎬 VIDEO FORGE HACKATHON LAUNCHER   ")
    print("=======================================")
    
    base_dir = os.getcwd()
    
    check_dependencies()
    
    # 1. Install Dependencies
    print("\n📦 Installing Dependencies...")
    if not os.path.exists("backend/node_modules"):
        run_command("npm install", cwd="backend")
    if not os.path.exists("frontend/node_modules"):
        run_command("npm install", cwd="frontend")
        
    # 2. Start Database
    start_db()
    
    print("\n🚀 Starting Services...")
    
    # 3. Start Backend
    backend_p = run_command("node server.js", cwd="backend", background=True)
    print("✅ Backend starting on port 3000...")
    
    # 4. Start Worker
    worker_p = run_command("node worker.js", cwd="backend", background=True)
    print("✅ Worker starting...")
    
    # 5. Start Frontend
    frontend_p = run_command("npm run dev", cwd="frontend", background=True)
    print("✅ Frontend starting...")
    
    print("\n⏳ Waiting for services to stabilize (5s)...")
    time.sleep(5)
    
    print("\n🌐 Opening Browser...")
    webbrowser.open("http://localhost:5173")
    
    print("\n=======================================")
    print("   ✅ SYSTEM RUNNING!   ")
    print("   Press Ctrl+C to stop all services   ")
    print("=======================================")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
        backend_p.terminate()
        worker_p.terminate()
        frontend_p.terminate()
        # Optional: cleanup docker? No, keep data.
        print("✅ All services stopped. Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    main()
