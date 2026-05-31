import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminModel } from '../models/Admin';

export class AuthController {
  static async loginAdmin(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const admin = await AdminModel.findByEmail(email);
      if (!admin) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const passwordValid = await bcrypt.compare(senha, admin.senha);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, nivel: 'admin_master' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email } });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async loginCandidato(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const { CandidatoModel } = await import('../models/Candidato');
      const candidato = await CandidatoModel.findByEmail(email);
      if (!candidato) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const passwordValid = await bcrypt.compare(senha, candidato.senha);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: candidato.id, email: candidato.email, nivel: 'candidato', candidato_id: candidato.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ token, candidato: { id: candidato.id, nome: candidato.nome, email: candidato.email, cargo: candidato.cargo } });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async loginMultiplicador(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const pool = (await import('../config/database')).default;
      const result = await pool.query(
        'SELECT * FROM multiplicadores WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const multiplicador = result.rows[0];
      const passwordValid = await bcrypt.compare(senha, multiplicador.senha);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: multiplicador.id, email: multiplicador.email, nivel: 'multiplicador', multiplicador_id: multiplicador.id, candidato_id: multiplicador.candidato_id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ token, multiplicador: { id: multiplicador.id, nome: multiplicador.nome, email: multiplicador.email } });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, nivel: user.nivel, candidato_id: user.candidato_id, multiplicador_id: user.multiplicador_id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
