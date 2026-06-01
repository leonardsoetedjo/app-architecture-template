#!/usr/bin/env python3
"""
Collect architecture compliance metrics for dashboard and reporting.
Outputs JSON format for easy consumption by dashboard generators.

Usage: python scripts/collect-architecture-metrics.py
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

def parse_violation_log(log_path: str) -> list:
    """Parse the violation log CSV file."""
    violations = []
    
    if not os.path.exists(log_path):
        return violations
    
    with open(log_path, 'r') as f:
        lines = f.readlines()
        if len(lines) <= 1:  # Only header or empty
            return violations
        
        # Skip header
        for line in lines[1:]:
            parts = line.strip().split(',')
            if len(parts) >= 8:
                violations.append({
                    'timestamp': parts[0],
                    'commit_sha': parts[1],
                    'user_name': parts[2],
                    'user_email': parts[3],
                    'branch': parts[4],
                    'violation_type': parts[5],
                    'file_path': parts[6],
                    'details': parts[7],
                    'status': parts[8] if len(parts) > 8 else 'OPEN'
                })
    
    return violations

def calculate_metrics(violations: list) -> dict:
    """Calculate compliance metrics from violations."""
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    metrics = {
        'total_violations': len(violations),
        'violations_this_week': 0,
        'violations_this_month': 0,
        'open_violations': 0,
        'closed_violations': 0,
        'by_type': defaultdict(int),
        'by_user': defaultdict(int),
        'by_file': defaultdict(int),
        'by_branch': defaultdict(int),
        'recent_violations': [],
        'compliance_rate': 100.0,  # Default to 100% if no data
        'trend': 'stable'
    }
    
    for v in violations:
        # Parse timestamp
        try:
            v_time = datetime.fromisoformat(v['timestamp'].replace('Z', '+00:00'))
        except:
            v_time = now
        
        # Count by time period
        if v_time >= week_ago:
            metrics['violations_this_week'] += 1
        if v_time >= month_ago:
            metrics['violations_this_month'] += 1
        
        # Count by status
        if v['status'] == 'OPEN':
            metrics['open_violations'] += 1
        else:
            metrics['closed_violations'] += 1
        
        # Count by type
        metrics['by_type'][v['violation_type']] += 1
        
        # Count by user
        metrics['by_user'][v['user_name']] += 1
        
        # Count by file
        metrics['by_file'][v['file_path']] += 1
        
        # Count by branch
        metrics['by_branch'][v['branch']] += 1
    
    # Get recent violations (last 10)
    metrics['recent_violations'] = violations[-10:] if violations else []
    
    # Convert defaultdicts to regular dicts for JSON serialization
    metrics['by_type'] = dict(metrics['by_type'])
    metrics['by_user'] = dict(metrics['by_user'])
    metrics['by_file'] = dict(metrics['by_file'])
    metrics['by_branch'] = dict(metrics['by_branch'])
    
    # Calculate trend (compare this week vs last week)
    two_weeks_ago = now - timedelta(days=14)
    last_week_count = 0
    for v in violations:
        try:
            v_time = datetime.fromisoformat(v['timestamp'].replace('Z', '+00:00'))
            if two_weeks_ago <= v_time <= week_ago:
                last_week_count += 1
        except:
            pass
    
    if metrics['violations_this_week'] > last_week_count:
        metrics['trend'] = 'worsening'
    elif metrics['violations_this_week'] < last_week_count:
        metrics['trend'] = 'improving'
    else:
        metrics['trend'] = 'stable'
    
    # Calculate compliance rate (simplified - would need total commits for accurate rate)
    # For now, use inverse of violation rate
    if metrics['violations_this_month'] > 0:
        # Assume ~100 commits per month, adjust as needed
        estimated_commits = 100
        metrics['compliance_rate'] = max(0, 100 - (metrics['violations_this_month'] / estimated_commits * 100))
    
    return metrics

def main():
    repo_root = Path(__file__).parent.parent
    violation_log = repo_root / '.github' / 'architecture-violations.log'
    
    violations = parse_violation_log(str(violation_log))
    metrics = calculate_metrics(violations)
    
    # Add metadata
    metrics['generated_at'] = datetime.now().isoformat()
    metrics['log_file'] = str(violation_log)
    
    # Output JSON
    print(json.dumps(metrics, indent=2, default=str))

if __name__ == '__main__':
    main()
