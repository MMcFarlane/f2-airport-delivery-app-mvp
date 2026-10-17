import type { SQLiteDatabase } from 'expo-sqlite';

import type { CatalogSource } from '@/src/config/catalog';
import type { CatalogRepository } from '@/src/data/repositories';

import { mapDiscount, mapMenuItem, mapRestaurant, type DiscountRow, type MenuItemRow, type RestaurantRow } from './mappers';

const MENU_SELECT = `
  SELECT
    menu_items.id,
    menu_items.restaurant_id,
    restaurants.name AS restaurant_name,
    menu_items.name,
    menu_items.description,
    menu_items.price_cents,
    menu_items.prep_minutes,
    menu_items.category,
    menu_items.image_color,
    menu_items.featured,
    menu_items.popular,
    menu_items.kind,
    menu_items.badge,
    menu_items.compare_at_cents,
    menu_items.tags,
    menu_items.position
  FROM menu_items
  JOIN restaurants ON restaurants.id = menu_items.restaurant_id
`;

export class SqliteCatalogRepository implements CatalogRepository {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly source: CatalogSource,
  ) {}

  async listRestaurants() {
    const rows = await this.db.getAllAsync<RestaurantRow>(
      `SELECT * FROM restaurants WHERE source = ? ORDER BY fastest_prep_minutes, position`,
      this.source,
    );
    return rows.map(mapRestaurant);
  }

  async getRestaurant(id: string) {
    const row = await this.db.getFirstAsync<RestaurantRow>(
      `SELECT * FROM restaurants WHERE id = ? AND source = ?`,
      id,
      this.source,
    );
    return row ? mapRestaurant(row) : null;
  }

  async listMenu(restaurantId: string) {
    const rows = await this.db.getAllAsync<MenuItemRow>(
      `${MENU_SELECT} WHERE restaurants.source = ? AND menu_items.restaurant_id = ? AND menu_items.kind = 'item' ORDER BY menu_items.position`,
      this.source,
      restaurantId,
    );
    return rows.map(mapMenuItem);
  }

  async listFeatured() {
    const rows = await this.db.getAllAsync<MenuItemRow>(
      `${MENU_SELECT} WHERE restaurants.source = ? AND menu_items.featured = 1 ORDER BY menu_items.prep_minutes, menu_items.position`,
      this.source,
    );
    return rows.map(mapMenuItem);
  }

  async listSpecials() {
    const rows = await this.db.getAllAsync<MenuItemRow>(
      `${MENU_SELECT} WHERE restaurants.source = ? AND menu_items.kind = 'special' ORDER BY menu_items.position`,
      this.source,
    );
    return rows.map(mapMenuItem);
  }

  async getItem(id: string) {
    const row = await this.db.getFirstAsync<MenuItemRow>(
      `${MENU_SELECT} WHERE restaurants.source = ? AND menu_items.id = ?`,
      this.source,
      id,
    );
    return row ? mapMenuItem(row) : null;
  }

  async findDiscount(code: string) {
    const row = await this.db.getFirstAsync<DiscountRow>(
      `SELECT code, percent_off, label FROM discount_codes WHERE code = ? COLLATE NOCASE`,
      code.trim(),
    );
    return row ? mapDiscount(row) : null;
  }
}
