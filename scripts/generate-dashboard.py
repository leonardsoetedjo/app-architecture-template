#!/usr/bin/env python3
"""
Generate architecture compliance dashboard HTML from metrics JSON.

Usage: python scripts/generate-dashboard.py metrics.json output.html
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def load_metrics(metrics_path: str) -> dict:
    """Load metrics from JSON file."""
    try:
        with open(metrics_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading metrics: {e}")
        return {}

def generate_html(metrics: dict) -> str:
    """Generate HTML dashboard from metrics."""
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    # Extract key metrics
    total_violations = metrics.get('total_violations', 0)
    violations_week = metrics.get('violations_this_week', 0)
    violations_month = metrics.get('violations_this_month', 0)
    compliance_rate = metrics.get('compliance_rate', 100.0)
    trend = metrics.get('trend', 'stable')
    open_violations = metrics.get('open_violations', 0)
    closed_violations = metrics.get('closed_violations', 0)
    
    # Trend indicator
    trend_icon = "📈" if trend == "worsening" else "📉" if trend == "improving" else "➡️"
    trend_class = "worsening" if trend == "worsening" else "improving" if trend == "improving" else "stable"
    
    # By type breakdown
    by_type = metrics.get('by_type', {})
    by_type_rows = ""
    if by_type:
        for vtype, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:10]:
            by_type_rows += f"""
            <tr>
                <td>{vtype}</td>
                <td>{count}</td>
                <td><div class="bar" style="width: {min(count * 10, 100)}%;"></div></td>
            </tr>"""
    else:
        by_type_rows = '<tr><td colspan="3">No violations recorded</td></tr>'
    
    # Recent violations
    recent = metrics.get('recent_violations', [])
    recent_rows = ""
    if recent:
        for v in reversed(recent[-10:]):
            date = v.get('timestamp', 'Unknown')[:10]
            vtype = v.get('violation_type', 'Unknown')
            fpath = v.get('file_path', 'Unknown')
            status = v.get('status', 'OPEN')
            status_class = "open" if status == "OPEN" else "closed"
            recent_rows += f"""
            <tr>
                <td>{date}</td>
                <td>{vtype}</td>
                <td><code>{fpath}</code></td>
                <td><span class="status {status_class}">{status}</span></td>
            </tr>"""
    else:
        recent_rows = '<tr><td colspan="4">No violations recorded</td></tr>'
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛡️ Architecture Compliance Dashboard</title>
    <style>
        :root {{
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-tertiary: #21262d;
            --text-primary: #f0f6fc;
            --text-secondary: #8b949e;
            --border: #30363d;
            --success: #238636;
            --warning: #d29922;
            --error: #da3633;
            --info: #58a6ff;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.5;
            padding: 2rem;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        h1 {{
            font-size: 2rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }}
        
        .subtitle {{
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }}
        
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}
        
        .metric-card {{
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
        }}
        
        .metric-card h2 {{
            font-size: 0.875rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }}
        
        .metric-value {{
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }}
        
        .metric-trend {{
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }}
        
        .trend-improving {{ color: var(--success); }}
        .trend-worsening {{ color: var(--error); }}
        .trend-stable {{ color: var(--text-secondary); }}
        
        .section {{
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }}
        
        .section h2 {{
            font-size: 1.25rem;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }}
        
        th, td {{
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border);
        }}
        
        th {{
            color: var(--text-secondary);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.75rem;
        }}
        
        tr:hover {{
            background: var(--bg-tertiary);
        }}
        
        .bar {{
            height: 4px;
            background: var(--info);
            border-radius: 2px;
            margin-top: 0.25rem;
        }}
        
        .status {{
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }}
        
        .status.open {{
            background: rgba(218, 54, 51, 0.15);
            color: var(--error);
        }}
        
        .status.closed {{
            background: rgba(35, 134, 54, 0.15);
            color: var(--success);
        }}
        
        code {{
            background: var(--bg-tertiary);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
            font-size: 0.8em;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
        }}
        
        .footer {{
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Architecture Compliance Dashboard</h1>
        <p class="subtitle">Real-time visibility into architecture guardrails effectiveness</p>
        <p class="subtitle">Last updated: {now}</p>
        
        <div class="metrics">
            <div class="metric-card">
                <h2>Compliance Rate</h2>
                <div class="metric-value">{compliance_rate:.1f}%</div>
                <div class="metric-trend {trend_class}">
                    {trend_icon} {trend.title()}
                </div>
            </div>
            
            <div class="metric-card">
                <h2>Violations This Week</h2>
                <div class="metric-value">{violations_week}</div>
                <div class="metric-trend">
                    vs. {violations_month - violations_week} last month
                </div>
            </div>
            
            <div class="metric-card">
                <h2>Open Violations</h2>
                <div class="metric-value">{open_violations}</div>
                <div class="metric-trend">
                    {closed_violations} closed
                </div>
            </div>
            
            <div class="metric-card">
                <h2>Total Violations</h2>
                <div class="metric-value">{total_violations}</div>
                <div class="metric-trend">
                    All time
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔥 Violations by Type</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Distribution</th>
                    </tr>
                </thead>
                <tbody>
                    {by_type_rows}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🕐 Recent Violations</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>File</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {recent_rows}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Architecture Compliance Dashboard • Generated by GitHub Actions</p>
            <p>Related: Issue #85 • <a href="https://github.com/leonardsoetedjo/app-architecture-template" style="color: var(--info);">Repository</a></p>
        </div>
    </div>
</body>
</html>
"""
    
    return html

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate-dashboard.py <metrics.json> <output.html>")
        sys.exit(1)
    
    metrics_path = sys.argv[1]
    output_path = sys.argv[2]
    
    print(f"📊 Loading metrics from {metrics_path}...")
    metrics = load_metrics(metrics_path)
    
    if not metrics:
        print("⚠️  No metrics available - generating empty dashboard")
    
    print(f"🎨 Generating dashboard HTML...")
    html = generate_html(metrics)
    
    # Create output directory
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Write HTML
    output_file.write_text(html)
    
    print(f"✅ Dashboard generated: {output_file}")
    print(f"   Deploy to GitHub Pages to view: https://<username>.github.io/<repo>/dashboard/")

if __name__ == '__main__':
    main()
