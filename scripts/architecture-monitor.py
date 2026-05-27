#!/usr/bin/env python3
"""
Real-time architecture monitoring for AI agent sessions.

Watches for file changes and validates architecture compliance BEFORE commit.
Blocks violating changes automatically.

Usage: python scripts/architecture-monitor.py

Features:
- Watches source files for changes
- Runs architecture check on each change
- Auto-reverts violating changes
- Logs violations
- Escalates after 3+ violations in session
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ watchdog not installed. Install with: pip install watchdog")
    sys.exit(1)


class ArchitectureMonitor(FileSystemEventHandler):
    def __init__(self):
        self.violation_count = 0
        self.violation_log = Path('.github/architecture-violations.log')
        self.last_check = {}  # Track last check time per file to avoid duplicates
        
    def should_check_file(self, file_path: Path) -> bool:
        """Determine if file should be architecture-checked."""
        # Only check source files
        if file_path.suffix not in ['.py', '.java', '.ts', '.tsx', '.js', '.jsx', '.vue']:
            return False
        
        # Skip test files
        if 'test' in str(file_path).lower() or 'spec' in str(file_path).lower():
            return False
        
        # Skip node_modules, __pycache__, etc.
        skip_dirs = ['node_modules', '__pycache__', '.git', 'dist', 'build', 'venv', '.venv']
        for part in file_path.parts:
            if part in skip_dirs:
                return False
        
        return True
    
    def check_file_architecture(self, file_path: Path) -> bool:
        """
        Check architecture compliance for a single file.
        Returns True if passes, False if violation.
        """
        print(f"\n🔍 Checking architecture: {file_path}")
        
        # Determine layer from path
        file_str = str(file_path)
        layer = None
        forbidden_pattern = None
        
        if '/domain/' in file_str or '\\domain\\' in file_str:
            layer = 'domain'
            if file_path.suffix == '.java':
                forbidden_pattern = r'import org\.springframework|import jakarta\.persistence|import javax\.persistence|import lombok\.'
            elif file_path.suffix == '.py':
                forbidden_pattern = r'import fastapi|import sqlalchemy|from fastapi|from sqlalchemy|from pydantic'
            elif file_path.suffix in ['.ts', '.tsx', '.js', '.jsx', '.vue']:
                forbidden_pattern = r'from.*infrastructure|import.*infrastructure'
        
        elif '/application/' in file_str or '\\application\\' in file_str:
            layer = 'application'
            if file_path.suffix == '.java':
                forbidden_pattern = r'import.*restcontroller|import.*controller'
            elif file_path.suffix == '.py':
                forbidden_pattern = r'from.*infrastructure|import.*infrastructure'
        
        # If not in architecture-critical path, skip
        if layer is None or forbidden_pattern is None:
            print(f"  ℹ️  File not in architecture-critical path, skipping")
            return True
        
        # Check for forbidden imports
        try:
            content = file_path.read_text(encoding='utf-8')
            import re
            matches = re.findall(forbidden_pattern, content, re.IGNORECASE)
            
            if matches:
                print(f"  ❌ VIOLATION DETECTED in {file_path}")
                print(f"     Layer: {layer}")
                print(f"     Forbidden imports found: {matches}")
                
                # Log violation
                self.log_violation(file_path, layer, str(matches))
                
                return False
            else:
                print(f"  ✅ {file_path} passes architecture check")
                return True
                
        except Exception as e:
            print(f"  ⚠️  Error checking file: {e}")
            return True
    
    def log_violation(self, file_path: Path, layer: str, details: str):
        """Log violation to file."""
        self.violation_count += 1
        
        timestamp = datetime.now().isoformat()
        try:
            commit_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], 
                                                  stderr=subprocess.DEVNULL).decode().strip()
        except:
            commit_sha = 'uncommitted'
        
        try:
            user_name = subprocess.check_output(['git', 'config', 'user.name'], 
                                                 stderr=subprocess.DEVNULL).decode().strip()
        except:
            user_name = 'unknown'
        
        # Create log file if needed
        if not self.violation_log.exists():
            self.violation_log.parent.mkdir(parents=True, exist_ok=True)
            self.violation_log.write_text(
                'timestamp,commit_sha,user_name,user_email,branch,violation_type,file_path,details,status\n'
            )
        
        # Log violation
        with open(self.violation_log, 'a') as f:
            f.write(f'{timestamp},{commit_sha},{user_name},,HEAD,REALTIME_{layer.upper()}_VIOLATION,{file_path},{details},OPEN\n')
        
        print(f"  📝 Logged violation #{self.violation_count}")
    
    def auto_revert(self, file_path: Path):
        """Auto-revert violating file to last committed version."""
        print(f"  🔄 Auto-reverting {file_path}...")
        try:
            subprocess.run(['git', 'restore', str(file_path)], 
                          check=True, capture_output=True, text=True)
            print(f"  ✅ Reverted successfully")
        except subprocess.CalledProcessError as e:
            print(f"  ⚠️  Could not revert: {e}")
        except Exception as e:
            print(f"  ⚠️  Could not revert: {e}")
    
    def escalate_if_needed(self):
        """Check if escalation is needed."""
        if self.violation_count >= 3:
            print(f"\n🚨 ESCALATION: {self.violation_count} violations detected in current session")
            print(f"   Notifying architecture team...")
            
            # Try to create GitHub issue
            try:
                issue_title = f"🚨 Architecture Escalation: {self.violation_count} violations in AI agent session"
                issue_body = f"""## Critical: Multiple violations detected in real-time monitoring

**Violation count:** {self.violation_count}
**Session time:** {datetime.now().isoformat()}

### Recent Violations

See `.github/architecture-violations.log` for details.

### Action Required

- [ ] Review AI agent session
- [ ] Identify root cause of repeated violations
- [ ] Update AI agent instructions/skills if needed
- [ ] Close this issue when resolved

---
*Auto-created by architecture monitor*
"""
                subprocess.run(['gh', 'issue', 'create', 
                               '--title', issue_title,
                               '--body', issue_body,
                               '--label', 'architecture,escalation,critical'],
                              check=True, capture_output=True)
                print(f"  ✅ Escalation issue created")
            except Exception as e:
                print(f"  ⚠️  Could not create escalation issue: {e}")
    
    def on_modified(self, event):
        """Handle file modification events."""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        if not self.should_check_file(file_path):
            return
        
        # Rate limiting - don't check same file too frequently
        now = time.time()
        last_check = self.last_check.get(str(file_path), 0)
        if now - last_check < 2:  # Minimum 2 seconds between checks
            return
        
        self.last_check[str(file_path)] = now
        
        # Check architecture
        if not self.check_file_architecture(file_path):
            # Violation detected - auto-revert
            self.auto_revert(file_path)
            
            # Check escalation
            self.escalate_if_needed()


def main():
    """Start the architecture monitor."""
    watch_path = Path('.')
    
    print("🛡️  Architecture Monitor")
    print("=" * 60)
    print(f"Watching: {watch_path.absolute()}")
    print("File types: .py, .java, .ts, .tsx, .js, .jsx, .vue")
    print("Skip patterns: test, spec, node_modules, __pycache__, dist, build")
    print("")
    print("Features:")
    print("  - Real-time architecture validation")
    print("  - Auto-revert on violations")
    print("  - Violation logging")
    print("  - Escalation after 3+ violations")
    print("")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    # Start monitoring
    event_handler = ArchitectureMonitor()
    observer = Observer()
    observer.schedule(event_handler, str(watch_path), recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping architecture monitor...")
        observer.stop()
    observer.join()
    print(f"Total violations detected: {event_handler.violation_count}")


if __name__ == '__main__':
    main()
