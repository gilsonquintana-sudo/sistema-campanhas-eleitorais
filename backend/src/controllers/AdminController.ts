import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { CandidatoModel } from '../models/Candidato';

export class AdminController {
  static async getAllCandidatos(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const candidatos = await CandidatoModel.findAll(limit, offset);
      const total = await CandidatoModel.countTotal();
      
      res.json({ candidatos, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar candidatos' });
    }
  }

  static async createCandidato(req: Request, res: Response) {
    try {
      const { nome, numero, cargo, cidade, partido, email, telefone, senha, foto } = req.body;

      if (!nome || !numero || !cargo || !cidade || !partido || !email || !telefone || !senha) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const existingCandidato = await CandidatoModel.findByEmail(email);
      if (existingCandidato) {
        return res.status(400).json({ error: 'Email já registrado' });
      }

      const hashedPassword = await bcrypt.hash(senha, 10);

      const candidato = await CandidatoModel.create({
        nome,
        numero,
        cargo,
        cidade,
        partido,
        email,
        telefone,
        senha: hashedPassword,
        foto: foto || null,
        status: 'ativo'
      });

      res.status(201).json({ candidato: { id: candidato.id, nome: candidato.nome, email: candidato.email } });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar candidato' });
    }
  }

  static async updateCandidato(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.senha) {
        updates.senha = await bcrypt.hash(updates.senha, 10);
      }

      const candidato = await CandidatoModel.update(parseInt(id), updates);
      if (!candidato) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      res.json({ candidato });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar candidato' });
    }
  }

  static async deleteCandidato(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await CandidatoModel.delete(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      res.json({ message: 'Candidato deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar candidato' });
    }
  }

  static async getDashboardStats(req: Request, res: Response) {
    try {
      const totalCandidatos = await CandidatoModel.countTotal();
      
      const pool = (await import('../config/database')).default;
      const multiResult = await pool.query('SELECT COUNT(*) FROM multiplicadores');
      const totalMultiplicadores = parseInt(multiResult.rows[0].count);
      
      const apoiaResult = await pool.query('SELECT COUNT(*) FROM apoiadores');
      const totalApoiadores = parseInt(apoiaResult.rows[0].count);

      res.json({
        totalCandidatos,
        totalMultiplicadores,
        totalApoiadores,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}
