// src/interfaces/TelegramAlerting.interface.ts

export interface ITelegramAlertingService {
  sendAlert(title: string, message: string): void;
  sendArbitrageOpportunity(opportunity: any): void; // Using 'any' for now to match existing code
}
