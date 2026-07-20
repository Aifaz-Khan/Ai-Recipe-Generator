import bcrypt from "bcrypt";
import db from "../config/db.js";

class User {
  // Create a new user
  static async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, created_at`,
      [email, hashedPassword, name],
    );

    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, email, name, created_at, updated_at
             FROM users
             WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      `SELECT *
             FROM users
             WHERE email = $1`,
      [email],
    );

    return result.rows[0] || null;
  }

  // Update user profile
  static async update(id, { name, email }) {
    const result = await db.query(
      `UPDATE users
         SET
             name = COALESCE($1, name),
             email = COALESCE($2, email)
         WHERE id = $3
         RETURNING id, email, name, created_at, updated_at`,
      [name ?? null, email ?? null, id],
    );

    return result.rows[0] || null;
  }

  // Update user password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.query(
      `UPDATE users
         SET password_hash = $1
         WHERE id = $2
         RETURNING id, email, name, created_at, updated_at`,
      [hashedPassword, id],
    );

    return result.rows[0] || null;
  }

  // Verify password
  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return null;
    }

    return user;
  }
  // Delete user
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM users
         WHERE id = $1
         RETURNING id, email, name`,
      [id],
    );

    return result.rows[0] || null;
  }
}

export default User;
