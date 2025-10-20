import { IFiatConversionService } from "./IFiatConversionService";

export class FiatConversionService implements IFiatConversionService {
  private readonly baseUrl = "https://blockchain.info";

  async getTicker(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching ticker from Blockchain.com:", error);
      throw error;
    }
  }

  async toBTC(currency: string, value: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tobtc?currency=${currency}&value=${value}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const btcValue = await response.text();
      return parseFloat(btcValue);
    } catch (error) {
      console.error("Error converting to BTC with Blockchain.com:", error);
      throw error;
    }
  }
}
