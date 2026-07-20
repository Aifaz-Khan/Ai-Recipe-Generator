import db from "../config/db.js";

class UserPreferences {

    // Create or update user preferences
    static async upsert(userId, preferences) {
        const {
            dietary_restrictions = [],
            allergies = [],
            preferred_cuisines = [],
            default_servings = 4,
            measurement_unit = "metric",
        } = preferences;

        const result = await db.query(
            `INSERT INTO user_preferences (
                user_id,
                dietary_restrictions,
                allergies,
                preferred_cuisines,
                default_servings,
                measurement_unit
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET
                dietary_restrictions = EXCLUDED.dietary_restrictions,
                allergies = EXCLUDED.allergies,
                preferred_cuisines = EXCLUDED.preferred_cuisines,
                default_servings = EXCLUDED.default_servings,
                measurement_unit = EXCLUDED.measurement_unit
            RETURNING *`,
            [
                userId,
                dietary_restrictions,
                allergies,
                preferred_cuisines,
                default_servings,
                measurement_unit,
            ]
        );

        return result.rows[0];
    }

    // Get preferences by user ID
    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT *
             FROM user_preferences
             WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0] || null;
    }

    // Delete preferences
    static async delete(userId) {
        const result = await db.query(
            `DELETE FROM user_preferences
             WHERE user_id = $1
             RETURNING *`,
            [userId]
        );

        return result.rows[0] || null;
    }
}

export default UserPreferences;