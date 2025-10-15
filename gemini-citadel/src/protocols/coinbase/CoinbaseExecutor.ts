import { IExecutor } from '../../interfaces/IExecutor';
import { ITradeAction } from '../../interfaces/ITradeAction';
import { ITradeReceipt } from '../../interfaces/ITradeReceipt';
import crypto from 'crypto';
import axios from 'axios';

const API_BASE_URL = 'https://api.coinbase.com/api/v3/brokerage';

export class CoinbaseExecutor implements IExecutor {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly executionMode: string;

  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY || '';
    this.apiSecret = process.env.COINBASE_API_SECRET || '';
    this.executionMode = process.env.EXECUTION_MODE || 'DRY_RUN';

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Coinbase API key and secret must be provided in environment variables.');
    }
  }

  private createSignature(timestamp: string, method: string, requestPath: string, body: string): string {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', this.apiSecret).update(message).digest('hex');
  }

  private async makeSignedRequest(method: string, path: string, body: any = {}): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = JSON.stringify(body);
    const signature = this.createSignature(timestamp, method, path, bodyString);

    const headers = {
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    const url = `${API_BASE_URL}${path}`;

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: bodyString,
      });
      return response.data;
    } catch (error: any) {
      console.error(`[CoinbaseExecutor] API Request FAILED for ${method} ${path}:`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  public async placeOrder(action: ITradeAction): Promise<ITradeReceipt> {
    const { pair, action: tradeAction, price, amount } = action;

    const requestBody = {
      product_id: pair,
      side: tradeAction.toUpperCase(),
      base_size: amount.toString(), // Coinbase uses base_size for amount
      limit_price: price.toString(),
      order_type: 'LIMIT',
    };

    if (this.executionMode === 'DRY_RUN') {
      console.log('[CoinbaseExecutor][DRY_RUN] Would place the following order:');
      console.log(JSON.stringify(requestBody, null, 2));

      return {
        success: true,
        orderId: `dry-run-${Date.now()}`,
        filledAmount: amount,
        message: 'Dry run execution successful.',
      };
    } else if (this.executionMode === 'LIVE') {
      console.log('[CoinbaseExecutor][LIVE] Placing real order...');
      const response = await this.makeSignedRequest('POST', '/orders', requestBody);

      return {
        success: response.success,
        orderId: response.order_id,
        filledAmount: parseFloat(response.filled_size || '0'),
        message: response.message || `Live execution response: ${response.order_id}`,
      };
    } else {
      throw new Error(`Invalid EXECUTION_MODE: ${this.executionMode}. Must be 'DRY_RUN' or 'LIVE'.`);
    }
  }
}