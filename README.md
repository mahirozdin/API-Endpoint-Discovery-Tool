# API Endpoint Discovery Tool v2.0

Advanced penetration testing tool for discovering API endpoints through intelligent web crawling.

## 🚀 Features

- **Advanced Form Detection**: Automatic form discovery and filling with test data
- **JavaScript Interaction**: Automatic clicking on buttons and clickable elements
- **Smart Request Capture**: Monitoring XHR, Fetch and all HTTP requests
- **Real-time Progress**: Detailed information at every step
- **URL Filtering**: Focus only on target domain
- **Multiple HTTP Methods**: GET, POST, PUT, DELETE, PATCH testing
- **Auth Detection**: Detect authentication requirements

## 📦 Installation

```bash
npm install
```

## 🎯 Usage

### Basic Usage

```bash
node index.js --domain=example.com
```

### Advanced Options

```bash
node index.js --domain=api.example.com --maxPages=100 --timeout=20000 --delay=1000
```

### Parameters

| Parameter    | Shortcut | Default | Description               |
| ------------ | -------- | ------- | ------------------------- |
| `--domain`   | `-d`     | -       | Domain to scan (required) |
| `--maxPages` | `-p`     | 50      | Maximum number of pages   |
| `--timeout`  | `-t`     | 15000   | Page load timeout (ms)    |
| `--delay`    | `-w`     | 2000    | Delay between pages (ms)  |
| `--depth`    | -        | 3       | Maximum crawl depth       |
| `--help`     | `-h`     | -       | Show help message         |

## 🛠️ How It Works

1. **Start**: Begins scanning from the given domain
2. **Page Crawling**: Collects all links and adds them to queue
3. **Form Processing**: Finds forms on pages and fills them with test data
4. **Interaction**: Clicks important buttons (login, search, submit, etc.)
5. **Request Monitoring**: Captures and analyzes all HTTP requests
6. **Endpoint Testing**: Tests found endpoints with different HTTP methods
7. **Reporting**: Categorizes and reports found API endpoints

## 📊 Output Format

The tool provides the following information after scanning:

- **Endpoint URL**: Full address of the found API endpoint
- **HTTP Method**: Working HTTP method (GET, POST, etc.)
- **Auth Status**: Authentication requirement (AUTH REQUIRED / NO AUTH)
- **Response Status**: HTTP status code

## 🔍 Example Output

```
✅ FOUND API ENDPOINTS:
------------------------------------------------------------

🔸 NO AUTH (3):
  https://api.example.com/users - NOAUTH - GET - Status: 200
  https://api.example.com/products - NOAUTH - GET - Status: 200
  https://api.example.com/search - NOAUTH - POST - Status: 200

🔸 AUTH REQUIRED (2):
  https://api.example.com/profile - AUTH REQUIRED - GET - Status: 401
  https://api.example.com/admin - AUTH REQUIRED - POST - Status: 403
```

## ⚡ Quick Test

To test the tool:

```bash
npm run test
```

This command runs a quick test on httpbin.org.

## 🔧 Development

Project structure:

```
apipentest/
├── index.js                 # Main entry point
├── src/
│   ├── crawler.js           # Main crawler class
│   └── utils/
│       ├── logger.js        # Logging system
│       ├── requestInterceptor.js  # HTTP request capturing
│       ├── formHandler.js   # Form processing
│       └── urlFilter.js     # URL filtering
├── package.json
└── README.md
```

## ⚠️ Warnings

- This tool should only be used for authorized penetration testing
- Set delay settings appropriately to avoid overloading target systems
- Do not test other systems without legal permission
- Pay attention to rate limiting

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. This means you can use, modify, and distribute the code freely, but please include the original license in any copies or substantial portions of the software.

## 📞 Contact

mahirozdin[at]bubiapps.com

## 📜 Disclaimer

This tool is intended for educational and authorized security testing purposes only. The developers are not responsible for any misuse or illegal activities performed using this software. Always ensure you have permission to test the target systems.

## 🛡️ Security Notice

This tool is designed to help security professionals discover API endpoints. It is crucial to use it responsibly and ethically. Unauthorized use against systems without permission is illegal and unethical. Always ensure you have explicit permission before testing any system.
