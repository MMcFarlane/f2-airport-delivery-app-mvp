import type { FlightRepository, NotConfigured } from '@/src/data/repositories';

const NOT_CONFIGURED: NotConfigured = { configured: false };

export class SqliteFlightRepository implements FlightRepository {
  async lookup(_flightNumber: string): Promise<NotConfigured> {
    return NOT_CONFIGURED;
  }

  async listDepartures(): Promise<NotConfigured> {
    return NOT_CONFIGURED;
  }
}
