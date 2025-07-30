# Actual Budget API

A RESTful Web API server for [Actual Budget](https://actualbudget.org/) that provides programmatic access to your budget data, transactions, accounts, and categories.

## Features

- **Transaction Management**: Add transactions to your budget accounts
- **Account Access**: Retrieve all accounts from your budget
- **Category Management**: Get budget categories
- **Transaction History**: Fetch transactions by account and date range
- **Budget Analysis**: Access monthly budget data
- **Multi-Budget Support**: Work with multiple budgets using different credentials
- **Connection Pooling**: Efficient API client management with connection reuse
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Monitoring**: Built-in health check endpoint

## Installation

### Using npm

```bash
npm install
npm run build
node dist/main.js
```

### Using Nix (Recommended)

This project includes Nix flake support for reproducible development environments:

```bash
# Development shell
nix develop

# Build the package
nix build
```

## Configuration

The server can be configured using environment variables:

```bash
# Server Configuration
ACTUAL_API_PORT=31001                                    # API server port (default: 31001)
ACTUAL_API_DATA_DIR=/var/lib/actual-budget-api          # Data directory (default: /var/lib/actual-budget-api)
ACTUAL_API_SERVER_URL=http://localhost                   # Actual Budget server URL (default: http://localhost)
```

Create a `.env` file in your project root:

```env
ACTUAL_API_PORT=31001
ACTUAL_API_DATA_DIR=./data
ACTUAL_API_SERVER_URL=https://your-actual-server.com
```

## Usage

### Starting the Server

```bash
# Production mode
npm run build
node dist/main.js
```

### Authentication

All API endpoints require authentication parameters in the request body:

- `password`: Your Actual Budget server login password (required)
- `encryptPassword`: Budget encryption password (optional, if your budget is encrypted)

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and active connections count.

### Add Transaction

```http
POST /budget/:budgetId/transactions
```

**Request Body:**

```json
{
  "password": "your-server-password",
  "encryptPassword": "your-encryption-password", // optional
  "account": "account-uuid",
  "date": "2024-01-15", // optional, defaults to today
  "amount": 25.50, // in dollars (will be converted to cents)
  "payee_name": "Coffee Shop",
  "category": "category-uuid", // optional
  "notes": "Morning coffee", // optional
  "cleared": false // optional, defaults to false
}
```

### Get Accounts

```http
POST /budget/:budgetId/accounts
```

**Request Body:**

```json
{
  "password": "your-server-password",
  "encryptPassword": "your-encryption-password" // optional
}
```

### Get Categories

```http
POST /budget/:budgetId/categories
```

**Request Body:**

```json
{
  "password": "your-server-password",
  "encryptPassword": "your-encryption-password" // optional
}
```

### Get Transactions

```http
POST /budget/:budgetId/accounts/:accountId/transactions
```

**Request Body:**

```json
{
  "password": "your-server-password",
  "encryptPassword": "your-encryption-password", // optional
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### Get Budget Month

```http
POST /budget/:budgetId/month/:month
```

**Request Body:**

```json
{
  "password": "your-server-password",
  "encryptPassword": "your-encryption-password" // optional
}
```

Month format: `YYYY-MM` (e.g., `2024-01`)

## Example Usage

### Adding a Transaction

```bash
curl -X POST http://localhost:31001/budget/my-budget-id/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "password": "my-server-password",
    "account": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 15.75,
    "payee_name": "Grocery Store",
    "category": "660e8400-e29b-41d4-a716-446655440000",
    "notes": "Weekly groceries"
  }'
```

### Getting Accounts

```bash
curl -X POST http://localhost:31001/budget/my-budget-id/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "password": "my-server-password"
  }'
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... }, // The requested data
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

## Development

### Prerequisites

- Node.js 18+
- TypeScript
- Access to an Actual Budget server

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd actual-budget-api

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building

```bash
npm run build
```

### Project Structure

```
├── main.ts          # Main server file
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
├── flake.nix          # Nix flake configuration
└── nix/
    ├── package.nix    # Nix package definition
    └── shell.nix      # Development shell
```

## Connection Management

The API server efficiently manages connections to your Actual Budget server:

- **Connection Pooling**: Reuses existing connections based on server URL and password
- **Graceful Shutdown**: Properly closes all connections on server termination
- **Error Handling**: Robust error handling with detailed error messages

## Security Considerations

- All authentication is handled through request body parameters
- Passwords are not logged or exposed in responses
- CORS is enabled for cross-origin requests
- Connections are properly managed and cleaned up

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:

1. Check the [Actual Budget documentation](https://actualbudget.org/docs/)
2. Review the API server logs for detailed error messages
3. Open an issue on the project repository

---

**Note**: This is an unofficial API wrapper for Actual Budget. Make sure you have a running Actual Budget server instance to connect to.
