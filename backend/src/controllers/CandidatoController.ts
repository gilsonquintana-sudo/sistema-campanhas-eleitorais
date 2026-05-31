import { Request, Response } from 'express';
import { CandidatoModel } from '../models/Candidato';
import { MultiplicadorModel } from '../models/Multiplicador';
import { ApoiadorModel } from '../models/Apoiador';

export class CandidatoController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id || parseInt(req.params.id);
      
      const totalMultiplicadores = await MultiplicadorModel.countByCandidato(candidatoId);
      const totalApoiadores = await ApoiadorModel.countByCandidato(candidatoId);

      const pool = (await import('../config/database')).default;
      
      // Crescimento diário
      const dailyResult = await pool.query(
        `SELECT DATE(data_cadastro) as data, COUNT(*) as total 
         FROM apoiadores 
         WHERE candidato_id = $1 AND data_cadastro >= NOW() - INTERVAL '1 day'
         GROUP BY DATE(data_cadastro)`,
        [candidatoId]
      );
      const crescimentoDiario = dailyResult.rows.length > 0 ? dailyResult.rows[0].total : 0;

      // Crescimento semanal
      const weeklyResult = await pool.query(
        `SELECT COUNT(*) as total FROM apoiadores 
         WHERE candidato_id = $1 AND data_cadastro >= NOW() - INTERVAL '7 days'`,
        [candidatoId]
      );
      const crescimentoSemanal = parseInt(weeklyResult.rows[0].total);

      // Crescimento mensal
      const monthlyResult = await pool.query(
        `SELECT COUNT(*) as total FROM apoiadores 
         WHERE candidato_id = $1 AND data_cadastro >= NOW() - INTERVAL '30 days'`,
        [candidatoId]
      );
      const crescimentoMensal = parseInt(monthlyResult.rows[0].total);

      // Distribuição por bairros
      const bairrosResult = await pool.query(
        `SELECT bairro, COUNT(*) as total FROM apoiadores 
         WHERE candidato_id = $1 
         GROUP BY bairro ORDER BY total DESC`,
        [candidatoId]
      );
      const distribuicaoBairros = bairrosResult.rows;

      // Ranking de multiplicadores
      const rankingResult = await pool.query(
        `SELECT m.id, m.nome, COUNT(a.id) as total_apoiadores, 
                ROUND(100.0 * COUNT(a.id) / $2::numeric, 2) as percentual
         FROM multiplicadores m
         LEFT JOIN apoiadores a ON m.id = a.multiplicador_id
         WHERE m.candidato_id = $1
         GROUP BY m.id, m.nome
         ORDER BY total_apoiadores DESC`,
        [candidatoId, totalApoiadores || 1]
      );
      const rankingMultiplicadores = rankingResult.rows;

      res.json({
        totalMultiplicadores,
        totalApoiadores,
        crescimentoDiario,
        crescimentoSemanal,
        crescimentoMensal,
        distribuicaoBairros,
        rankingMultiplicadores,
        projecaoVotos: CandidatoController.calcularProjecao(totalApoiadores)
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }

  static calcularProjecao(totalApoiadores: number) {
    return {
      conservador: Math.round(totalApoiadores * 0.6),
      medio: Math.round(totalApoiadores * 0.75),
      otimista: Math.round(totalApoiadores * 0.9)
    };
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id || parseInt(req.params.id);
      const candidato = await CandidatoModel.findById(candidatoId);
      
      if (!candidato) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      res.json({ candidato });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id || parseInt(req.params.id);
      const updates = req.body;

      delete updates.id;
      delete updates.data_criacao;

      const candidato = await CandidatoModel.update(candidatoId, updates);
      if (!candidato) {
        return res.status(404).json({ error: 'Candidato não encontrado' });
      }

      res.json({ candidato });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  static async getApoiadores(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id || parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const apoiadores = await ApoiadorModel.findByCandidatoId(candidatoId, limit, offset);
      const total = await ApoiadorModel.countByCandidato(candidatoId);

      res.json({ apoiadores, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar apoiadores' });
    }
  }

  static async getMultiplicadores(req: Request, res: Response) {
    try {
      const candidatoId = req.user?.candidato_id || parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const multiplicadores = await MultiplicadorModel.findByCandidatoId(candidatoId, limit, offset);
      const total = await MultiplicadorModel.countByCandidato(candidatoId);

      res.json({ multiplicadores, total, limit, offset });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar multiplicadores' });
    }
  }
}
