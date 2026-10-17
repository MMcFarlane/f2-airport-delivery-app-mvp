import type { SQLiteDatabase } from 'expo-sqlite';

import type { CatalogSource } from '@/src/config/catalog';
import type { AddCartLineInput, CartRepository } from '@/src/data/repositories';
import { DEFAULT_TIP_CENTS, type CartLine } from '@/src/domain';

type CartLineRow = {
  item_id: string;
  name: string;
  restaurant_id: string;
  restaurant_name: string;
  price_cents: number;
  prep_minutes: number;
  quantity: number;
  note: string | null;
  discount_code: string | null;
};

export class SqliteCartRepository implements CartRepository {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly source: CatalogSource,
  ) {}

  async getCart() {
    const meta = await this.db.getFirstAsync<{ tip_cents: number }>(
      `SELECT tip_cents FROM cart_meta WHERE id = 1`,
    );
    const rows = await this.db.getAllAsync<CartLineRow>(
      `SELECT
        cart_lines.item_id,
        menu_items.name,
        menu_items.restaurant_id,
        restaurants.name AS restaurant_name,
        menu_items.price_cents,
        menu_items.prep_minutes,
        cart_lines.quantity,
        cart_lines.note,
        cart_lines.discount_code
      FROM cart_lines
      JOIN menu_items ON menu_items.id = cart_lines.item_id
      JOIN restaurants ON restaurants.id = menu_items.restaurant_id
      WHERE restaurants.source = ?
      ORDER BY cart_lines.rowid`,
      this.source,
    );

    return {
      tipCents: meta?.tip_cents ?? DEFAULT_TIP_CENTS,
      lines: rows.map(mapLine),
    };
  }

  async addLine(input: AddCartLineInput) {
    const quantity = input.quantity ?? 1;
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const item = await this.db.getFirstAsync<{ id: string }>(
      `SELECT menu_items.id
       FROM menu_items
       JOIN restaurants ON restaurants.id = menu_items.restaurant_id
       WHERE menu_items.id = ? AND restaurants.source = ?`,
      input.itemId,
      this.source,
    );
    if (!item) {
      throw new Error('Menu item not found');
    }

    if (input.discountCode) {
      await this.requireDiscount(input.discountCode);
    }

    const existing = await this.db.getFirstAsync<{ quantity: number }>(
      `SELECT quantity FROM cart_lines WHERE item_id = ?`,
      input.itemId,
    );

    if (existing) {
      await this.db.runAsync(
        `UPDATE cart_lines
         SET quantity = ?, note = COALESCE(?, note), discount_code = COALESCE(?, discount_code)
         WHERE item_id = ?`,
        existing.quantity + quantity,
        input.note ?? null,
        input.discountCode ?? null,
        input.itemId,
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO cart_lines (item_id, quantity, note, discount_code) VALUES (?, ?, ?, ?)`,
        input.itemId,
        quantity,
        input.note ?? null,
        input.discountCode ?? null,
      );
    }

    return this.getCart();
  }

  async setQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      await this.db.runAsync(`DELETE FROM cart_lines WHERE item_id = ?`, itemId);
    } else {
      await this.db.runAsync(`UPDATE cart_lines SET quantity = ? WHERE item_id = ?`, quantity, itemId);
    }
    return this.getCart();
  }

  async setLineDiscount(itemId: string, code: string | null) {
    const line = await this.db.getFirstAsync<{ item_id: string }>(
      `SELECT item_id FROM cart_lines WHERE item_id = ?`,
      itemId,
    );
    if (!line) {
      throw new Error('Cart line not found');
    }
    if (code) {
      await this.requireDiscount(code);
    }
    await this.db.runAsync(`UPDATE cart_lines SET discount_code = ? WHERE item_id = ?`, code, itemId);
    return this.getCart();
  }

  async setTip(tipCents: number) {
    if (tipCents < 0) {
      throw new Error('Tip cannot be negative');
    }
    await this.db.runAsync(
      `INSERT INTO cart_meta (id, tip_cents) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET tip_cents = excluded.tip_cents`,
      tipCents,
    );
    return this.getCart();
  }

  async clear() {
    await this.db.runAsync(`DELETE FROM cart_lines`);
    await this.db.runAsync(
      `INSERT INTO cart_meta (id, tip_cents) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET tip_cents = excluded.tip_cents`,
      DEFAULT_TIP_CENTS,
    );
    return this.getCart();
  }

  private async requireDiscount(code: string) {
    const discount = await this.db.getFirstAsync<{ code: string }>(
      `SELECT code FROM discount_codes WHERE code = ? COLLATE NOCASE`,
      code.trim(),
    );
    if (!discount) {
      throw new Error('Unknown discount code');
    }
  }
}

function mapLine(row: CartLineRow): CartLine {
  return {
    itemId: row.item_id,
    name: row.name,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    priceCents: row.price_cents,
    prepMinutes: row.prep_minutes,
    quantity: row.quantity,
    note: row.note,
    discountCode: row.discount_code,
  };
}
