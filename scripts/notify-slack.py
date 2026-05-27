#!/usr/bin/env python3
"""
Send architecture violation notifications to Slack.

Usage: python scripts/notify-slack.py <webhook_url> <violation_type> <file_path>

Environment variables:
  SLACK_WEBHOOK_URL: Slack incoming webhook URL (required)
"""

import json
import os
import sys
import urllib.request
from datetime import datetime

def send_slack_notification(webhook_url: str, violation_type: str, file_path: str, details: str = ""):
    """Send violation notification to Slack."""
    
    # Determine color based on violation severity
    color = "warning"
    if "ESCALATION" in violation_type:
        color = "danger"
    elif "DOMAIN" in violation_type:
        color = "#d29922"  # Yellow for domain violations
    
    # Build message blocks
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🛡️ Architecture Violation Detected",
                "emoji": True
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Type:*\n{violation_type}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*File:*\n`{file_path}`"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Time:*\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Status:*\n🔴 Requires fix"
                }
            ]
        }
    ]
    
    # Add details if provided
    if details:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Details:*\n{details[:2000]}"  # Truncate to avoid Slack limits
            }
        })
    
    # Add action buttons
    blocks.append({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Violation Log",
                    "emoji": True
                },
                "url": "https://github.com/leonardsoetedjo/app-architecture-template/blob/main/.github/architecture-violations.log",
                "action_id": "view_log"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Dashboard",
                    "emoji": True
                },
                "url": "https://leonardsoetedjo.github.io/app-architecture-template/dashboard/",
                "action_id": "view_dashboard"
            }
        ]
    })
    
    # Build payload
    payload = {
        "text": f"🛡️ Architecture Violation: {violation_type}",
        "blocks": blocks,
        "attachments": [
            {
                "color": color,
                "footer": "Architecture Guardrails",
                "ts": int(datetime.now().timestamp())
            }
        ]
    }
    
    # Send to Slack
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("✅ Slack notification sent successfully")
                return True
            else:
                print(f"❌ Slack API returned status {response.status}")
                return False
    
    except Exception as e:
        print(f"❌ Error sending Slack notification: {e}")
        return False

def main():
    # Get webhook URL from environment or argument
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
    
    if len(sys.argv) > 1:
        webhook_url = sys.argv[1]
    
    if not webhook_url:
        print("❌ Slack webhook URL required")
        print("")
        print("Usage:")
        print("  export SLACK_WEBHOOK_URL='https://hooks.slack.com/...'")
        print("  python scripts/notify-slack.py <violation_type> <file_path> [details]")
        print("")
        print("Or:")
        print("  python scripts/notify-slack.py <webhook_url> <violation_type> <file_path> [details]")
        sys.exit(1)
    
    # Get violation details from arguments
    if len(sys.argv) < 3:
        print("❌ Violation type and file path required")
        sys.exit(1)
    
    violation_type = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1]
    file_path = sys.argv[3] if len(sys.argv) > 3 else "Unknown"
    details = sys.argv[4] if len(sys.argv) > 4 else ""
    
    print(f"📤 Sending Slack notification for: {violation_type}")
    success = send_slack_notification(webhook_url, violation_type, file_path, details)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
