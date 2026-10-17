import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProfileRepository, ProfilePatch } from '@/src/data/repositories';

import { mapProfile, type ProfileRow } from './mappers';

const PROFILE_SELECT = `
  SELECT name, email, phone, card_brand, card_last4, dietary, order_updates, boarding_reminders, deals
  FROM profile
  WHERE id = 1
`;

export class SqliteProfileRepository implements ProfileRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getProfile() {
    const row = await this.db.getFirstAsync<ProfileRow>(PROFILE_SELECT);
    if (!row) {
      throw new Error('Profile is missing');
    }
    return mapProfile(row);
  }

  async updateProfile(patch: ProfilePatch) {
    const current = await this.getProfile();
    const next = {
      name: patch.name ?? current.name,
      email: patch.email ?? current.email,
      phone: patch.phone ?? current.phone,
      cardBrand: patch.cardBrand ?? current.cardBrand,
      cardLast4: patch.cardLast4 ?? current.cardLast4,
      dietary: patch.dietary ?? current.dietary,
      notifications: {
        orderUpdates: patch.notifications?.orderUpdates ?? current.notifications.orderUpdates,
        boardingReminders: patch.notifications?.boardingReminders ?? current.notifications.boardingReminders,
        deals: patch.notifications?.deals ?? current.notifications.deals,
      },
    };

    await this.db.runAsync(
      `UPDATE profile
       SET name = ?, email = ?, phone = ?, card_brand = ?, card_last4 = ?, dietary = ?,
           order_updates = ?, boarding_reminders = ?, deals = ?
       WHERE id = 1`,
      next.name,
      next.email,
      next.phone,
      next.cardBrand,
      next.cardLast4,
      JSON.stringify(next.dietary),
      next.notifications.orderUpdates ? 1 : 0,
      next.notifications.boardingReminders ? 1 : 0,
      next.notifications.deals ? 1 : 0,
    );

    return this.getProfile();
  }
}
