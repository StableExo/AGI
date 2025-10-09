import { DataService } from './services/data.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file in the project root
dotenv.config();

export class AppController {
  private dataService: DataService;

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('FATAL: RPC_URL is not defined in the environment variables.');
    }
    this.dataService = new DataService(rpcUrl);
  }

  public async start(): Promise<void> {
    console.log('[AppController] Starting all services...');
    try {
      // Test the data service connection on startup
      await this.dataService.getBlockNumber();
      console.log('[AppController] All services started successfully.');
    } catch (error) {
      console.error('[AppController] An error occurred during service startup:', error);
      throw error;
    }
  }
}