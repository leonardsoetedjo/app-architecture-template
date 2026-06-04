#!/bin/bash
# Install Yeoman generators for Clean Architecture scaffolding

set -e

echo "🔧 Installing Clean Architecture Yeoman Generators..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Ubuntu: sudo apt install nodejs npm"
    echo "   macOS:  brew install node"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install Yeoman globally
echo ""
echo "📦 Installing Yeoman globally..."
npm install -g yo

# Install generator dependencies
echo ""
echo "📦 Installing generator dependencies..."
cd "$(dirname "$0")"
npm install

# Link generators
echo ""
echo "🔗 Linking generators..."
npm link

echo ""
echo "✅ Installation complete!"
echo ""
echo "📚 Available generators:"
echo "   yo clean-architecture:endpoint    - Create full API endpoint"
echo "   yo clean-architecture:usecase     - Create use case"
echo "   yo clean-architecture:entity      - Create domain entity"
echo "   yo clean-architecture:migration   - Create database migration"
echo ""
echo "🚀 Quick start:"
echo "   yo clean-architecture:endpoint"
echo ""
