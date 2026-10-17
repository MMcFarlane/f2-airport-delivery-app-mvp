import type { SQLiteDatabase } from 'expo-sqlite';

import type { OrderStatus } from '@/src/domain';
import type { CreateOrderInput, OrderRepository } from '@/src/data/repositories';

import { mapOrder, type OrderLineRow, type OrderRow } from './mappers';

const NEXT_STATUS: Record<OrderStatus, OrderStatus> = {
  received: 'being_prepared',
  being_prepared: 'courier_on_the_way',
  courier_on_the_way: 'at_gate',
  at_gate: 'at_gate',
  delivered: 'delivered',
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async listOrders() {
    const orders = await this.db.getAllAsync<OrderRow>(`SELECT * FROM orders ORDER BY placed_at DESC`);
    const lines = await this.db.getAllAsync<OrderLineRow>(
      `SELECT order_id, item_id, name, price_cents, quantity, prep_minutes FROM order_lines ORDER BY id`,
    );
    return orders.map((order) => mapOrder(order, lines.filter((line) => line.order_id === order.id)));
  }

  async getOrder(id: string) {
    const order = await this.db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, id);
    if (!order) return null;
    const lines = await this.db.getAllAsync<OrderLineRow>(
      `SELECT order_id, item_id, name, price_cents, quantity, prep_minutes FROM order_lines WHERE order_id = ? ORDER BY id`,
      id,
    );
    return mapOrder(order, lines);
  }

  async createOrder(input: CreateOrderInput) {
    const restaurant = await this.db.getFirstAsync<{ name: string }>(
      `SELECT name FROM restaurants WHERE id = ?`,
      input.restaurantId,
    );
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const id = `order-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString()}`;
    const status = input.status ?? 'being_prepared';
    const placedAt = new Date().toISOString();
    const code = confirmationCode();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO orders (
          id, restaurant_id, restaurant_name, status, code, gate, passenger_name,
          total_cents, placed_at, summary, delivered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        id,
        input.restaurantId,
        restaurant.name,
        status,
        code,
        input.gate,
        input.passengerName,
        input.totalCents,
        placedAt,
        input.summary,
      );

      for (const line of input.lines) {
        await this.db.runAsync(
          `INSERT INTO order_lines (order_id, item_id, name, price_cents, quantity, prep_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          id,
          line.itemId,
          line.name,
          line.priceCents,
          line.quantity,
          line.prepMinutes,
        );
      }
    });

    const order = await this.getOrder(id);
    if (!order) {
      throw new Error('Order did not save');
    }
    return order;
  }

  async advanceStatus(id: string) {
    const order = await this.getOrder(id);
    if (!order) return null;
    const status = NEXT_STATUS[order.status];
    const deliveredAt = status === 'delivered' ? new Date().toISOString() : order.deliveredAt;
    await this.db.runAsync(`UPDATE orders SET status = ?, delivered_at = ? WHERE id = ?`, status, deliveredAt, id);
    return this.getOrder(id);
  }
}

function confirmationCode(): string {
  let code = '';
  for (let index = 0; index < 4; index += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
