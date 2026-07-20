-- enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table 
CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT   CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user preference table 
CREATE TABLE IF NOT EXISTS user_preferences(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    preferred_cuisines TEXT[] DEFAULT '{}',
    default_servings INT DEFAULT 4,
    measurement_unit VARCHAR(20) DEFAULT 'metric',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- pantry Items table
CREATE TABLE IF NOT EXISTS pantry_items(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL (10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    expiry_date DATE,
    is_running_low BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- recipes table
CREATE TABLE IF NOT EXISTS recipes(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium',
    prep_time INT NOT NULL,
    cook_time INT NOT NULL,
    servings INT DEFAULT 4,
    instructions TEXT[] NOT NULL,
    dietary_tags TEXT[] DEFAULT '{}',
    user_notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- recipe ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- recipe nutrition table
CREATE TABLE IF NOT EXISTS recipe_nutrition(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    calories INT  DEFAULT 0,
    protein DECIMAL(8,2) DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    fats DECIMAL(8,2) DEFAULT 0,
    fibre DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id)
);

-- meal plans table
CREATE TABLE IF NOT EXISTS meal_plans(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (
        meal_type IN ('breakfast', 'lunch', 'dinner')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, meal_date, meal_type)
);

-- shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    from_meal_plan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PANTRY ITEMS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pantry_user_id
ON pantry_items(user_id);

CREATE INDEX IF NOT EXISTS idx_pantry_category
ON pantry_items(category);

CREATE INDEX IF NOT EXISTS idx_pantry_expiry_date
ON pantry_items(expiry_date);

CREATE INDEX IF NOT EXISTS idx_pantry_running_low
ON pantry_items(is_running_low);

-- =====================================================
-- RECIPES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_recipes_user_id
ON recipes(user_id);

CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type
ON recipes(cuisine_type);

CREATE INDEX IF NOT EXISTS idx_recipes_difficulty
ON recipes(difficulty);

-- =====================================================
-- RECIPE INGREDIENTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
ON recipe_ingredients(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name
ON recipe_ingredients(ingredient_name);

-- =====================================================
-- MEAL PLANS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id
ON meal_plans(user_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe_id
ON meal_plans(recipe_id);

CREATE INDEX IF NOT EXISTS idx_meal_plans_meal_date
ON meal_plans(meal_date);

CREATE INDEX IF NOT EXISTS idx_meal_plans_meal_type
ON meal_plans(meal_type);

-- =====================================================
-- SHOPPING LIST ITEMS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shopping_user_id
ON shopping_list_items(user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_category
ON shopping_list_items(category);

CREATE INDEX IF NOT EXISTS idx_shopping_checked
ON shopping_list_items(is_checked);

CREATE INDEX IF NOT EXISTS idx_shopping_ingredient_name
ON shopping_list_items(ingredient_name);

-- function to update update_at timestamp 
-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- User Preferences
CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Pantry Items
CREATE TRIGGER trg_pantry_items_updated_at
BEFORE UPDATE ON pantry_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Recipes
CREATE TRIGGER trg_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Meal Plans
CREATE TRIGGER trg_meal_plans_updated_at
BEFORE UPDATE ON meal_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Shopping List Items
CREATE TRIGGER trg_shopping_list_items_updated_at
BEFORE UPDATE ON shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();