import pool from '../config/database';
import { QueryResult } from 'pg';

export interface Admin {
  id: number;
  nome: string;
  email: string;
  senha: string;
  data_criacao: Date;
}

export class AdminModel {
  static async findById(id: number): Promise<Admin | null> {
    const result: QueryResult<Admin> = await pool.query(
      'SELECT * FROM admins WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<Admin | null> {
    const result: QueryResult<Admin> = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async create(admin: Omit<Admin, 'id' | 'data_criacao'>): Promise<Admin> {
    const result: QueryResult<Admin> = await pool.query(
      'INSERT INTO admins (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
      [admin.nome, admin.email, admin.senha]
    );
    return result.rows[0];
  }

  static async update(id: number, admin: Partial<Admin>): Promise<Admin | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(admin).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'data_criacao') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result: QueryResult<Admin> = await pool.query(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
