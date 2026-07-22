import db from "../config/db.js";
class Recipe {
  /**
   * Create a new Recipe with ingredients and nutritions
   */

  static async create(userId, recipeData) {
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      const {
        name,
        description,
        cuisine_type,
        difficulty,
        prep_time,
        cook_time,
        servings,
        instructions,
        dietary_tags = [],
        user_notes,
        image_url,
        ingredients = [],
        nutrition = {},
      } = recipeData;

      // Insert recipe
      const recipeResult = await client.query(
        `INSERT INTO recipes (
                user_id,
                name,
                description,
                cuisine_type,
                difficulty,
                prep_time,
                cook_time,
                servings,
                instructions,
                dietary_tags,
                user_notes,
                image_url
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
            RETURNING *`,
        [
          userId,
          name,
          description,
          cuisine_type,
          difficulty,
          prep_time,
          cook_time,
          servings,
          instructions,
          dietary_tags,
          user_notes,
          image_url,
        ],
      );

      const recipe = recipeResult.rows[0];

      // Insert ingredients
      if (ingredients.length > 0) {
        const ingredientValues = ingredients
          .map(
            (ing, index) =>
              `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`,
          )
          .join(", ");

        const ingredientParams = [
          recipe.id,
          ...ingredients.flatMap((ing) => [
            ing.ingredient_name,
            ing.quantity,
            ing.unit,
          ]),
        ];

        await client.query(
          `INSERT INTO recipe_ingredients (
            recipe_id,
            ingredient_name,
            quantity,
            unit
        )
        VALUES ${ingredientValues}`,
          ingredientParams,
        );
      }

      // Insert nutrition
      await client.query(
        `INSERT INTO recipe_nutrition (
                recipe_id,
                calories,
                protein,
                carbs,
                fats,
                fibre
            )
            VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          recipe.id,
          nutrition.calories || 0,
          nutrition.protein || 0,
          nutrition.carbs || 0,
          nutrition.fats || 0,
          nutrition.fibre || 0,
        ],
      );

      await client.query("COMMIT");

      return recipe;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  /**
   * Get recipe by ID
   */
  static async findById(id, userId) {
    // Get recipe
    const recipeResult = await db.query(
      `SELECT *
         FROM recipes
         WHERE id = $1
         AND user_id = $2`,
      [id, userId],
    );

    if (recipeResult.rows.length === 0) {
      return null;
    }

    const recipe = recipeResult.rows[0];

    // Get ingredients
    const ingredientsResult = await db.query(
      `SELECT
            id,
            ingredient_name,
            quantity,
            unit
         FROM recipe_ingredients
         WHERE recipe_id = $1
         ORDER BY id`,
      [id],
    );

    // Get nutrition
    const nutritionResult = await db.query(
      `SELECT
            calories,
            protein,
            carbs,
            fats,
            fibre
         FROM recipe_nutrition
         WHERE recipe_id = $1`,
      [id],
    );

    recipe.ingredients = ingredientsResult.rows;
    recipe.nutrition = nutritionResult.rows[0] || {};

    return recipe;
  }
  /**
   * Get all recipes for a user with filters
   */
  static async findByUserId(userId, filters = {}) {
    let query = `
        SELECT
            r.*,
            rn.calories
        FROM recipes r
        LEFT JOIN recipe_nutrition rn
            ON r.id = rn.recipe_id
        WHERE r.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    // Search by recipe name
    if (filters.search) {
      paramCount++;
      query += ` AND r.name ILIKE $${paramCount}`;
      params.push(`%${filters.search}%`);
    }

    // Filter by cuisine
    if (filters.cuisine_type) {
      paramCount++;
      query += ` AND r.cuisine_type = $${paramCount}`;
      params.push(filters.cuisine_type);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      paramCount++;
      query += ` AND r.difficulty = $${paramCount}`;
      params.push(filters.difficulty);
    }

    // Filter by dietary tag
    if (filters.dietary_tag) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(r.dietary_tags)`;
      params.push(filters.dietary_tag);
    }

    // Filter by maximum cook time
    if (filters.max_cook_time) {
      paramCount++;
      query += ` AND r.cook_time <= $${paramCount}`;
      params.push(filters.max_cook_time);
    }

    // Sorting
    const sortBy = filters.sort_by || "created_at";
    const sortOrder =
      filters.sort_order?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const allowedSortFields = [
      "created_at",
      "name",
      "cook_time",
      "prep_time",
      "difficulty",
    ];

    query += ` ORDER BY ${
      allowedSortFields.includes(sortBy) ? `r.${sortBy}` : "r.created_at"
    } ${sortOrder}`;

    // Pagination
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const offset = (page - 1) * limit;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    return result.rows;
  }
  /**
 * Get recent recipes
 */
static async getRecent(userId, limit = 5) {

    const result = await db.query(
        `SELECT
            r.id,
            r.name,
            r.description,
            r.cuisine_type,
            r.difficulty,
            r.prep_time,
            r.cook_time,
            r.servings,
            r.image_url,
            r.created_at,
            rn.calories
         FROM recipes r
         LEFT JOIN recipe_nutrition rn
            ON r.id = rn.recipe_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2`,
        [userId, limit]
    );

    return result.rows;
}
/**
 * Partial update recipe
 */
static async update(id, userId, updates) {

    const {
        name,
        description,
        cuisine_type,
        difficulty,
        prep_time,
        cook_time,
        servings,
        instructions,
        dietary_tags,
        user_notes,
        image_url
    } = updates;

    const result = await db.query(
        `UPDATE recipes
         SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            cuisine_type = COALESCE($3, cuisine_type),
            difficulty = COALESCE($4, difficulty),
            prep_time = COALESCE($5, prep_time),
            cook_time = COALESCE($6, cook_time),
            servings = COALESCE($7, servings),
            instructions = COALESCE($8, instructions),
            dietary_tags = COALESCE($9, dietary_tags),
            user_notes = COALESCE($10, user_notes),
            image_url = COALESCE($11, image_url)
         WHERE id = $12
         AND user_id = $13
         RETURNING *`,
        [
            name,
            description,
            cuisine_type,
            difficulty,
            prep_time,
            cook_time,
            servings,
            instructions,
            dietary_tags,
            user_notes,
            image_url,
            id,
            userId
        ]
    );

    return result.rows[0];
}
/**
 * Delete recipe
 */
static async delete(id, userId) {

    const result = await db.query(
        `DELETE FROM recipes
         WHERE id = $1
         AND user_id = $2
         RETURNING *`,
        [id, userId]
    );

    return result.rows[0];
}
/**
 * Get recipe statistics
 */
static async getStats(userId) {

    const result = await db.query(
        `SELECT
            COUNT(*) AS total_recipes,
            AVG(cook_time) AS avg_cook_time,
            COUNT(DISTINCT cuisine_type) AS total_cuisines
         FROM recipes
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0];
}
}

export default Recipe;