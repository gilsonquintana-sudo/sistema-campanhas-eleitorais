import pool from '../config/database';
import { QueryResult } from 'pg';

export interface Candidato {
  id: number;
  nome: string;
  numero: string;
  cargo: string;
  cidade: string;
  partido: string;
  email: string;
  telefone: string;
  senha: string;
  foto: string | null;
  status: 'ativo' | 'inativo';
  data_criacao: Date;
}

export class CandidatoModel {
  static async findById(id: number): Promise<Candidato | null> {
    const result: QueryResult<Candidato> = await pool.query(
      'SELECT * FROM candidatos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<Candidato | null> {
    const result: QueryResult<Candidato> = await pool.query(
      'SELECT * FROM candidatos WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Candidato[]> {
    const result: QueryResult<Candidato> = await pool.query(
      'SELECT * FROM candidatos ORDER BY data_criacao DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async create(candidato: Omit<Candidato, 'id' | 'data_criacao'>): Promise<Candidato> {
    const result: QueryResult<Candidato> = await pool.query(
      `INSERT INTO candidatos (nome, numero, cargo, cidade, partido, email, telefone, senha, foto, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [candidato.nome, candidato.numero, candidato.cargo, candidato.cidade, candidato.partido,
       candidato.email, candidato.telefone, candidato.senha, candidato.foto, candidato.status]
    );
    return result.rows[0];
  }

  static async update(id: number, candidato: Partial<Candidato>): Promise<Candidato | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(candidato).forEach(([key, value]) => {
      if (!['id', 'data_criacao'].includes(key)) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result: QueryResult<Candidato> = await pool.query(
      `UPDATE candidatos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM candidatos WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async countTotal(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM candidatos');
    return parseInt(result.rows[0].count, 10);
  }
}
