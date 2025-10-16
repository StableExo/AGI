export interface ITradeReceipt {
  success: boolean;
  orderId?: string;
  filledAmount?: number;
  message?: string;
}