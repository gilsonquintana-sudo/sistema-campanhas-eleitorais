import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { MultiplicadorModel } from '../models/Multiplicador';
import { ApoiadorModel } from '../models/Apoiador';

export class MultiplicadorController {
  static async create(req: Request, res: Response) {
    try {
      const { nome, telefone, email, bairro, senha } = req.body;
      const candidatoId = req.user?.candidato_id;

      if (!candidatoId || !nome || !telefone || !email || !bairro || !senha) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const hashedPassword = await bcrypt.hash(senha, 10);

      const multiplicador = await MultiplicadorModel.create({
        candidato_id: candidatoId,
        nome,
        telefone,
        email,
        bairro,
        senha: hashedPassword,
        status: 'ativo'
      });

      res.status(201).json({
        multiplicador: {
          id: multiplicador.id,
          nome: multiplicador.nome,
          email: multiplicador.email,
          bairro: multiplicador.bairro
        },
        landingPageUrl: `${process.env.FRONTEND_URL}/candidato/${candidatoId}/multiplicador/${multiplicador.id}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar multiplicador' });
    }
  }

  static async getMultiplicadores(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const multiplicadores = await MultiplicadorModel.findByCandidatoId(candidatoId, limit, offset);
      const total = await MultiplicadorModel.countByCandidato(candidatoId);

      res.json({ multiplicadores, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar multiplicadores' });
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const multiplicadorId = req.user?.multiplicador_id || parseInt(req.params.id);

      const totalApoiadores = await ApoiadorModel.countByMultiplicador(multiplicadorId);
      const apoiadores = await ApoiadorModel.findByMultiplicadorId(multiplicadorId, 100);

      const pool = (await import('../config/database')).default;

      // Crescimento por data
      const dailyResult = await pool.query(
        `SELECT DATE(data_cadastro) as data, COUNT(*) as total 
         FROM apoiadores 
         WHERE multiplicador_id = $1
         GROUP BY DATE(data_cadastro)
         ORDER BY data DESC
         LIMIT 30`,
        [multiplicadorId]
      );

      // Distribuição por bairro
      const bairrosResult = await pool.query(
        `SELECT bairro, COUNT(*) as total FROM apoiadores 
         WHERE multiplicador_id = $1 
         GROUP BY bairro ORDER BY total DESC`,
        [multiplicadorId]
      );

      res.json({
        totalApoiadores,
        crescimentoPorData: dailyResult.rows,
        distribuicaoBairros: bairrosResult.rows,
        projecao: {
          conservador: Math.round(totalApoiadores * 0.6),
          medio: Math.round(totalApoiadores * 0.75),
          otimista: Math.round(totalApoiadores * 0.9)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }

  static async getApoiadores(req: Request, res: Response) {
    try {
      const multiplicadorId = req.user?.multiplicador_id || parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const apoiadores = await ApoiadorModel.findByMultiplicadorId(multiplicadorId, limit, offset);
      const total = await ApoiadorModel.countByMultiplicador(multiplicadorId);

      res.json({ apoiadores, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar apoiadores' });
    }
  }

  static async updateApoiador(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      delete updates.multiplicador_id;
      delete updates.candidato_id;

      const apoiador = await ApoiadorModel.update(parseInt(id), updates);
      if (!apoiador) {
        return res.status(404).json({ error: 'Apoiador não encontrado' });
      }

      res.json({ apoiador });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar apoiador' });
    }
  }

  static async deleteMultiplicador(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await MultiplicadorModel.delete(parseInt(id));

      if (!success) {
        return res.status(404).json({ error: 'Multiplicador não encontrado' });
      }

      res.json({ message: 'Multiplicador deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar multiplicador' });
    }
  }
}
