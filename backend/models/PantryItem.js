import db from "../config/db.js";

class PantryItems {
  /**
   * Create a pantry item
   */
  static async create(userId, itemData) {
    const {
      name,
      quantity,
      unit,
      category,
      expiry_date,
      is_running_low = false,
    } = itemData;

    const result = await db.query(
      `INSERT INTO pantry_items
            (
                user_id,
                name,
                quantity,
                unit,
                category,
                expiry_date,
                is_running_low
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
      [userId, name, quantity, unit, category, expiry_date, is_running_low],
    );

    return result.rows[0];
  }
  /**
   * Get all pantry items for a user with optional filters
   */
  /**
   * Get all pantry items for a user with optional filters
   */
  static async findByUserId(userId, filters = {}) {
    let query = `
        SELECT *
        FROM pantry_items
        WHERE user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.is_running_low !== undefined) {
      paramCount++;
      query += ` AND is_running_low = $${paramCount}`;
      params.push(filters.is_running_low);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND LOWER(name) LIKE LOWER($${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    query += ` ORDER BY created_at  DESC`;

    const result = await db.query(query, params);

    return result.rows;
  }

  /**
   * Get pantry items expiring within the next 7 days
   */
  static async getExpiringSoon(userId, days = 7) {
    const result = await db.query(
      `SELECT *
        FROM pantry_items
        WHERE user_id = $1
        AND expiry_date IS NOT NULL
        AND expiry_date <=  CURRENT_DATE + INTERVAL '${days} days'
        AND expiry_date >= CURRENT_DATE
        ORDER BY expiry_date ASC`,
      [userId],
    );

    return result.rows;
  }
  /**
   * Get pantry item by ID
   */
  static async findById(id, userId) {
    const result = await db.query(
      `SELECT *
         FROM pantry_items
         WHERE id = $1
         AND user_id = $2`,
      [id, userId],
    );

    return result.rows[0];
  }
  /**
   * Update pantry item
   */
  static async update(id, userId, updates) {
    const { name, quantity, unit, category, expiry_date, is_running_low } =
      updates;

    const result = await db.query(
      `UPDATE pantry_items
         SET
            name = COALESCE($1, name),
            quantity = COALESCE($2, quantity),
            unit = COALESCE($3, unit),
            category = COALESCE($4, category),
            expiry_date = COALESCE($5, expiry_date),
            is_running_low = COALESCE($6, is_running_low)
         WHERE id = $7
         AND user_id = $8
         RETURNING *`,
      [name, quantity, unit, category, expiry_date, is_running_low, id, userId],
    );

    return result.rows[0];
  }

  /**
   * Delete pantry item
   */
  static async delete(id, userId) {
    const result = await db.query(
      `DELETE FROM pantry_items
         WHERE id = $1
         AND user_id = $2
         RETURNING *`,
      [id, userId],
    );

    return result.rows[0];
  }
  /**
   * Get pantry statistics
   */
  static async getStats(userId) {
    const result = await db.query(
      `SELECT
            COUNT(*) AS total_items,
            COUNT(*) FILTER (WHERE is_running_low = TRUE) AS low_stock_items,
            COUNT(*) FILTER (
                WHERE expiry_date IS NOT NULL
                AND expiry_date >= CURRENT_DATE
                AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
            ) AS expiring_soon_items,
            COUNT(DISTINCT category) AS total_categories
        FROM pantry_items
        WHERE user_id = $1`,
      [userId],
    );

    return result.rows[0];
  }
}

export default PantryItems;
