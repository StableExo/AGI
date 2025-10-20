export interface IFiatConversionService {
  /**
   * Fetches the latest BTC to fiat conversion rates.
   * @returns A promise that resolves to a map of currency codes to their ticker data.
   */
  getTicker(): Promise<Record<string, any>>;

  /**
   * Converts a given amount in a specified currency to its BTC equivalent.
   * @param currency The currency code (e.g., 'USD').
   * @param value The amount to convert.
   * @returns A promise that resolves to the BTC value.
   */
  toBTC(currency: string, value: number): Promise<number>;
}
