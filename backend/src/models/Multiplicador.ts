import pool from '../config/database';
import { QueryResult } from 'pg';

export interface Multiplicador {
  id: number;
  candidato_id: number;
  nome: string;
  telefone: string;
  email: string;
  bairro: string;
  senha: string;
  status: 'ativo' | 'inativo';
  data_criacao: Date;
}

export class MultiplicadorModel {
  static async findById(id: number): Promise<Multiplicador | null> {
    const result: QueryResult<Multiplicador> = await pool.query(
      'SELECT * FROM multiplicadores WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCandidatoId(candidato_id: number, limit: number = 50, offset: number = 0): Promise<Multiplicador[]> {
    const result: QueryResult<Multiplicador> = await pool.query(
      'SELECT * FROM multiplicadores WHERE candidato_id = $1 ORDER BY data_criacao DESC LIMIT $2 OFFSET $3',
      [candidato_id, limit, offset]
    );
    return result.rows;
  }

  static async create(multiplicador: Omit<Multiplicador, 'id' | 'data_criacao'>): Promise<Multiplicador> {
    const result: QueryResult<Multiplicador> = await pool.query(
      `INSERT INTO multiplicadores (candidato_id, nome, telefone, email, bairro, senha, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [multiplicador.candidato_id, multiplicador.nome, multiplicador.telefone, multiplicador.email,
       multiplicador.bairro, multiplicador.senha, multiplicador.status]
    );
    return result.rows[0];
  }

  static async update(id: number, multiplicador: Partial<Multiplicador>): Promise<Multiplicador | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(multiplicador).forEach(([key, value]) => {
      if (!['id', 'data_criacao'].includes(key)) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result: QueryResult<Multiplicador> = await pool.query(
      `UPDATE multiplicadores SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM multiplicadores WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async countByCandidato(candidato_id: number): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM multiplicadores WHERE candidato_id = $1', [candidato_id]);
    return parseInt(result.rows[0].count, 10);
  }
}
