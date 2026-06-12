#!/bin/bash
# MediFlow OPD — Automated Deployment Script
# This script prepares and deploys your application to Render.com

echo "═══════════════════════════════════════════════════════════════"
echo "  MEDIFLOW OPD — Deployment Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Please run this script from the directory containing all MediFlow files."
    exit 1
fi

echo -e "${BLUE}📁 Found package.json — looks good!${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Step 2: Test local server
echo -e "${YELLOW}Step 2: Testing local server...${NC}"
timeout 5 node server.js &
SERVER_PID=$!
sleep 2

# Test if server is running
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Local server running on port 4000${NC}"
else
    echo -e "${YELLOW}⚠️  Local server test failed (this is OK for static deployment)${NC}"
fi

# Kill the test server
kill $SERVER_PID 2>/dev/null
echo ""

# Step 3: Check for Git
echo -e "${YELLOW}Step 3: Checking Git...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not installed. Please install Git first.${NC}"
    exit 1
fi

if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "MediFlow OPD v3.1 — Ready for deployment"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository already exists${NC}"
fi
echo ""

# Step 4: GitHub setup
echo -e "${YELLOW}Step 4: GitHub Setup${NC}"
echo ""
echo "Do you have a GitHub repository already? (y/n)"
read -r has_repo

if [ "$has_repo" = "y" ] || [ "$has_repo" = "Y" ]; then
    echo "Enter your GitHub repository URL (e.g., https://github.com/username/mediflow-opd.git):"
    read -r repo_url
    git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"
    echo -e "${GREEN}✅ Remote configured${NC}"
else
    echo ""
    echo -e "${BLUE}📋 Manual Step Required:${NC}"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository (e.g., 'mediflow-opd')"
    echo "3. Do NOT initialize with README (we already have one)"
    echo "4. Copy the repository URL"
    echo ""
    echo "Enter your new GitHub repository URL:"
    read -r repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}✅ Remote added${NC}"
fi

echo ""
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}"
else
    echo -e "${RED}❌ Push failed. You may need to authenticate with GitHub.${NC}"
    echo "Run: git push -u origin main"
    exit 1
fi
echo ""

# Step 5: Render deployment instructions
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Code is on GitHub! Now deploy to Render:${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}Step 5: Deploy to Render.com${NC}"
echo ""
echo "1. Go to: ${YELLOW}https://dashboard.render.com${NC}"
echo "2. Sign up / Log in with GitHub"
echo "3. Click: ${YELLOW}New → Web Service${NC}"
echo "4. Connect your ${YELLOW}mediflow-opd${NC} repository"
echo "5. Configure:"
echo ""
echo "   Name:           mediflow-opd"
echo "   Environment:    Node"
echo "   Build Command:  npm install"
echo "   Start Command:  node server.js"
echo "   Instance Type:  Free"
echo ""
echo "6. Add Environment Variables:"
echo "   ${YELLOW}NODE_ENV=production${NC}"
echo "   ${YELLOW}JWT_SECRET=your-secret-key-here${NC}"
echo ""
echo "7. Click ${YELLOW}Deploy Web Service${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}Your app will be live at: https://mediflow-opd.onrender.com${NC}"
echo "═══════════════════════════════════════════════════════════════"
