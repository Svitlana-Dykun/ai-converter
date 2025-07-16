# AI Converter Plugin - Installation Guide

## 📦 Installation Methods

### Method 1: Upload via WordPress Admin (Recommended)

1. **Download the Plugin**
   - Download the `ai-converter.zip` file from your plugin directory

2. **Upload to WordPress**
   - Go to your WordPress admin dashboard
   - Navigate to **Plugins → Add New**
   - Click **Upload Plugin**
   - Choose the `ai-converter.zip` file
   - Click **Install Now**

3. **Activate the Plugin**
   - After installation, click **Activate Plugin**
   - The plugin is now active!

### Method 2: Manual FTP Upload

1. **Extract the ZIP File**
   - Download and extract `ai-converter.zip`
   - This creates an `ai-converter` folder

2. **Upload via FTP**
   - Connect to your website via FTP
   - Navigate to `/wp-content/plugins/`
   - Upload the entire `ai-converter` folder

3. **Activate in WordPress**
   - Go to **Plugins → Installed Plugins**
   - Find "AI Converter" and click **Activate**

## ⚙️ Configuration

### Step 1: Configure OpenAI API Key

1. **Go to Settings**
   - In WordPress admin, go to **Settings → AI Converter**

2. **Enter API Key**
   - Paste your OpenAI API key:

3. **Save Settings**
   - Click **Save Changes**
   - You should see a success message

### Step 2: Test the Plugin

1. **Open Elementor Editor**
   - Edit any page with Elementor
   - Add or select a container widget

2. **Test Conversion**
   - Right-click on the container
   - Select **Convert to V4** from the context menu
   - Wait for the conversion to complete

## 🔧 System Requirements

- **WordPress**: 6.2 or higher
- **PHP**: 7.4 or higher
- **Elementor**: Latest version
- **OpenAI API**: Active API key
- **Internet Connection**: Required for OpenAI API calls

## 📁 What's Included

```
ai-converter/
├── ai-converter.php          # Main plugin file
├── src/
│   ├── plugin.php           # Core plugin class
│   ├── OpenAIConverter.php  # OpenAI API integration
│   └── AdminSettings.php    # Admin settings page
├── assets/
│   ├── ai-converter.js      # Frontend JavaScript
│   └── chat/                # Training examples
│       ├── container-v3-*.json
│       └── container-v4-*.json
├── vendor/                  # Composer autoloader
└── composer.json           # Composer configuration
```

## 🚨 Troubleshooting

### Plugin Won't Activate
- **Check PHP Version**: Ensure PHP 7.4+
- **File Permissions**: Make sure files are readable
- **WordPress Version**: Ensure WordPress 6.2+

### API Key Issues
- **Invalid Key**: Double-check the API key format
- **Quota Exceeded**: Check your OpenAI usage limits
- **Network Issues**: Ensure server can reach OpenAI API

### Conversion Errors
- **Check Error Logs**: Look in WordPress error logs
- **Test with Simple Container**: Start with basic containers
- **API Limits**: Check OpenAI rate limits

## 🔒 Security Notes

- ✅ API key stored securely in WordPress database
- ✅ No frontend exposure of sensitive data
- ✅ WordPress nonce verification
- ✅ Proper input validation

## 🎯 Usage

1. **In Elementor Editor**
   - Right-click any container widget
   - Select **Convert to V4**
   - AI will convert V3 → V4 automatically

2. **Monitor Performance**
   - Check WordPress error logs
   - Monitor OpenAI API usage
   - Test with different container types

## 🆘 Support

If you encounter issues:
1. Check WordPress error logs
2. Verify OpenAI API key is correct
3. Ensure Elementor is up to date
4. Test with a simple container first

**Your AI Converter is now ready to use! 🚀** 
