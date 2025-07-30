import express, { Request, Response, NextFunction } from 'express';
import api from "@actual-app/api";
import dotenv from "dotenv";
import cors from "cors";
import { UUID } from 'crypto';

type ActualApiClient = typeof api;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.ACTUAL_API_PORT || 31001;
const DATA_DIR = process.env.ACTUAL_API_DATA_DIR || "/var/lib/actual-budget-api";
const SERVER_URL = process.env.ACTUAL_API_SERVER_URL || "http://localhost";
const apiClients = new Map<string, ActualApiClient>();

interface BaseInfo {
  password: string; // For Server Login Passowrd
  encryptPassword?: string; // For Encryption Password
};

interface TransactionSearch extends BaseInfo {
  startDate: string;
  endDate: string;
};

interface Transaction {
  account: UUID;
  date: string;
  amount: number;
  payee_name: string;
  category: UUID;
  notes?: string;
  cleared?: boolean;
};

interface TransactionPayload extends BaseInfo, Transaction { };

async function cleanup() {
  console.log("Shutting down gracefully...");
  for (const [key, apiInstance] of apiClients) {
    try {
      await apiInstance.shutdown();
      console.log(`Closed connection: ${key}`)
    } catch (error) {
      console.error(`Error closing connection ${key}:`, error);
    };
  };

  apiClients.clear();
  process.exit(0);
}

async function validateAuth(req: Request, res: Response, next: NextFunction) {
  const { password } = req.body || req.query;

  if (!password) {
    return res.status(400).json(
      {
        error: "Missing authentication parameters",
        details: 'Password is required'
      }
    )
  };

  next();
};

// Error handler
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

async function ensureBudgetDownloaded(apiClient: ActualApiClient, budgetId: UUID, encryptPassword?: string) {
  await apiClient.downloadBudget(budgetId, encryptPassword ? { password: encryptPassword } : {});
};

async function initApiClient(password: string): Promise<ActualApiClient> {
  const connectionKey = `${SERVER_URL}:${password}`;

  if (apiClients.has(connectionKey)) {
    const oldApi = apiClients.get(connectionKey);
    if (oldApi) return oldApi;
  }

  try {
    const api = await import("@actual-app/api");

    await api.init({
      dataDir: DATA_DIR,
      serverURL: SERVER_URL,
      password: password
    });

    apiClients.set(connectionKey, api);
    console.log(`Actual API initialized successfully`);
    return api;
  } catch (error) {
    console.error('Failed to initialize Actual API:', error);
    throw error;
  }
};

app.use(cors());
app.use(express.json());

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

app.get('/health', (_, res: Response) => {
  res.json({
    status: 'ok',
    activeConnections: apiClients.size,
    timestamp: new Date().toISOString()
  });
});

// Add Transaction
app.post('/budget/:budgetId/transactions', validateAuth, asyncHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.budgetId as UUID;
  const { password, encryptPassword, ...transaction } = req.body as TransactionPayload;

  if (!transaction.account || !transaction.amount) {
    return res.status(400).json({
      error: 'Missing required fields: account and amount are required'
    });
  };

  const apiClient = await initApiClient(password);
  await ensureBudgetDownloaded(apiClient, budgetId, encryptPassword);

  try {
    // Set default data
    transaction.date = transaction.date || new Date().toISOString().split('T')[0];
    transaction.cleared = (transaction.cleared == undefined) ? false : transaction.cleared
    transaction.amount = transaction.amount * 100

    const result = await apiClient.importTransactions(transaction.account, [transaction]);

    res.json({
      success: true,
      message: 'Transaction added successfully',
      data: result
    })
  } catch (error: unknown) {
    console.error('Error adding transaction:', error);
    res.status(500).json({
      error: 'Failed to add transaction',
      details: (error as Error).message
    });
  };

}))

// Get Accounts
app.post('/budget/:budgetId/accounts', validateAuth, asyncHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.budgetId as UUID;
  const { password, encryptPassword } = req.body as BaseInfo;

  const apiClient = await initApiClient(password);
  await ensureBudgetDownloaded(apiClient, budgetId, encryptPassword);

  try {
    const accounts = await apiClient.getAccounts();
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch accounts',
      details: (error as Error).message
    });
  }
}))

// Get Categories
app.post('/budget/:budgetId/categories', validateAuth, asyncHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.budgetId as UUID;
  const { password, encryptPassword } = req.body as BaseInfo;

  const apiClient = await initApiClient(password);
  await ensureBudgetDownloaded(apiClient, budgetId, encryptPassword);

  try {
    const categories = await apiClient.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: (error as Error).message
    });
  }
}))

// Get Transactions
app.post('/budget/:budgetId/accounts/:accountId/transactions', validateAuth, asyncHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.budgetId as UUID;
  const accountId = req.params.accountId as UUID;
  const { startDate, endDate, password, encryptPassword } = req.body as TransactionSearch;

  const apiClient = await initApiClient(password);
  await ensureBudgetDownloaded(apiClient, budgetId, encryptPassword);

  try {
    let transactions = await apiClient.getTransactions(accountId, startDate, endDate);
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      details: (error as Error).message
    });
  }
}))

// Get Budget Month
app.post('/budget/:budgetId/month/:month', validateAuth, asyncHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.budgetId as UUID;
  const month = req.params.month as string;
  const { password, encryptPassword } = req.body as BaseInfo;

  const apiClient = await initApiClient(password);
  await ensureBudgetDownloaded(apiClient, budgetId, encryptPassword);

  try {
    const budget = await apiClient.getBudgetMonth(month);
    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error fetching budget month:', error);
    res.status(500).json({
      error: 'Failed to fetch budget month',
      details: (error as Error).message
    });
  }
}))

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

app.use((_: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

app.listen(PORT, () => {
  console.log(`Actual Budget WebAPI Server running on port ${PORT}`);
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Data Directory: ${DATA_DIR}`);
})

module.exports = app;

