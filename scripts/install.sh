#!/bin/bash
set -e

REPO="prajwl-dh/cronify"
INSTALL_DIR="$HOME/.local/bin"

echo "🚀 Installing Cronify..."

# 1. Detect OS and Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" = "Linux" ]; then
    TARGET_OS="linux"
elif [ "$OS" = "Darwin" ]; then
    TARGET_OS="macos"
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

if [ "$ARCH" = "x86_64" ]; then
    TARGET_ARCH="x64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    TARGET_ARCH="arm64"
else
    echo "❌ Unsupported Architecture: $ARCH"
    exit 1
fi

# 2. Get latest release zip download URL via GitHub API
echo "🔍 Fetching latest release for ${TARGET_OS}-${TARGET_ARCH}..."
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url" | grep "${TARGET_OS}-${TARGET_ARCH}\.zip" | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "❌ Could not find a release for ${TARGET_OS}-${TARGET_ARCH}. Check your GitHub releases."
    exit 1
fi

# 3. Download and Extract
echo "⬇️ Downloading from $DOWNLOAD_URL..."
curl -sL "$DOWNLOAD_URL" -o /tmp/cronify.zip

echo "📦 Extracting binary..."
unzip -q -o /tmp/cronify.zip -d /tmp/cronify_extract

# 4. Install to Home Local Bin (No Sudo)
mkdir -p "$INSTALL_DIR"
mv /tmp/cronify_extract/cronify "$INSTALL_DIR/cronify"
chmod +x "$INSTALL_DIR/cronify"

# Clean up temp files
rm -f /tmp/cronify.zip
rm -rf /tmp/cronify_extract

# 5. Bypass Apple Gatekeeper (macOS only)
if [ "$TARGET_OS" = "macos" ]; then
    echo "🍏 Bypassing Apple Gatekeeper..."
    # Suppress errors if the quarantine attribute isn't present
    xattr -d com.apple.quarantine "$INSTALL_DIR/cronify" 2>/dev/null || true
fi

# 6. Add to PATH automatically
PROFILE=""
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    PROFILE="$HOME/.bashrc"
else
    PROFILE="$HOME/.profile"
fi

if ! grep -q "$INSTALL_DIR" "$PROFILE"; then
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$PROFILE"
    echo "🌐 Added Cronify to \$PATH in $PROFILE"
fi

# Make the command available in the CURRENT installer session
export PATH="$INSTALL_DIR:$PATH"

# 7. Initialize Daemon
echo "⚙️ Initializing daemon..."
"$INSTALL_DIR/cronify" install

#8. Run cronify help to display CLI usage
"$INSTALL_DIR/cronify" help