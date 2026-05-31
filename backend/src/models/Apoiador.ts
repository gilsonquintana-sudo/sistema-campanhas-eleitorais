import pool from '../config/database';
import { QueryResult } from 'pg';

export interface Apoiador {
  id: number;
  candidato_id: number;
  multiplicador_id: number;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  bairro: string;
  observacoes: string | null;
  data_cadastro: Date;
}

export class ApoiadorModel {
  static async findById(id: number): Promise<Apoiador | null> {
    const result: QueryResult<Apoiador> = await pool.query(
      'SELECT * FROM apoiadores WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCandidatoId(candidato_id: number, limit: number = 100, offset: number = 0): Promise<Apoiador[]> {
    const result: QueryResult<Apoiador> = await pool.query(
      'SELECT * FROM apoiadores WHERE candidato_id = $1 ORDER BY data_cadastro DESC LIMIT $2 OFFSET $3',
      [candidato_id, limit, offset]
    );
    return result.rows;
  }

  static async findByMultiplicadorId(multiplicador_id: number, limit: number = 100, offset: number = 0): Promise<Apoiador[]> {
    const result: QueryResult<Apoiador> = await pool.query(
      'SELECT * FROM apoiadores WHERE multiplicador_id = $1 ORDER BY data_cadastro DESC LIMIT $2 OFFSET $3',
      [multiplicador_id, limit, offset]
    );
    return result.rows;
  }

  static async create(apoiador: Omit<Apoiador, 'id' | 'data_cadastro'>): Promise<Apoiador> {
    const result: QueryResult<Apoiador> = await pool.query(
      `INSERT INTO apoiadores (candidato_id, multiplicador_id, nome, email, telefone, cidade, bairro, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [apoiador.candidato_id, apoiador.multiplicador_id, apoiador.nome, apoiador.email,
       apoiador.telefone, apoiador.cidade, apoiador.bairro, apoiador.observacoes]
    );
    return result.rows[0];
  }

  static async update(id: number, apoiador: Partial<Apoiador>): Promise<Apoiador | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(apoiador).forEach(([key, value]) => {
      if (!['id', 'data_cadastro'].includes(key)) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result: QueryResult<Apoiador> = await pool.query(
      `UPDATE apoiadores SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM apoiadores WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async countByCandidato(candidato_id: number): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM apoiadores WHERE candidato_id = $1', [candidato_id]);
    return parseInt(result.rows[0].count, 10);
  }

  static async countByMultiplicador(multiplicador_id: number): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM apoiadores WHERE multiplicador_id = $1', [multiplicador_id]);
    return parseInt(result.rows[0].count, 10);
  }

  static async findByBairro(candidato_id: number, bairro: string): Promise<Apoiador[]> {
    const result: QueryResult<Apoiador> = await pool.query(
      'SELECT * FROM apoiadores WHERE candidato_id = $1 AND bairro = $2',
      [candidato_id, bairro]
    );
    return result.rows;
  }
}
