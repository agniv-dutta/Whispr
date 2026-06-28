import subprocess, sys, time, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8080"])
time.sleep(5)
subprocess.run([sys.executable, "-c", "import sys; sys.path.insert(0,'.'); from seed import seed; import asyncio; asyncio.run(seed())"])
print("\nSEED COMPLETE. Backend running on port 8080.")
proc.wait()
