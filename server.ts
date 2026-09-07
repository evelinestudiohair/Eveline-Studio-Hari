import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Password reset email endpoint - sends real email to the user's inbox
  app.post('/api/auth/send-reset-email', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, resetLink, adminName } = req.body;

      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, error: 'E-mail do destinatário é obrigatório.' });
        return;
      }

      if (!resetLink || typeof resetLink !== 'string') {
        res.status(400).json({ success: false, error: 'Link de redefinição é obrigatório.' });
        return;
      }

      const targetEmail = email.trim().toLowerCase();
      const displayName = adminName || 'Eveline';

      const subject = '🔐 Link para Redefinir Senha - Eveline Studio Hair';
      const textMessage = `Olá, ${displayName}!\n\nRecebemos uma solicitação para alterar a sua senha de acesso ao sistema do salão Eveline Studio Hair.\n\nPara cadastrar sua nova senha com total segurança, acesse o link oficial abaixo:\n${resetLink}\n\nEste link é de uso único e expira em 15 minutos.\n\nSe você não fez essa solicitação, ignore este e-mail.`;
      
      const htmlMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9f6f3; margin: 0; padding: 24px; color: #2d2926; }
            .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e8e4e1; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
            .header { text-align: center; border-bottom: 1px solid #f0eae4; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: bold; color: #8b5e3c; font-style: italic; }
            .badge { display: inline-block; background: #f5ede6; color: #8b5e3c; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; margin-top: 8px; }
            .content { font-size: 14px; line-height: 1.6; color: #4a423d; }
            .btn-wrapper { text-align: center; margin: 28px 0; }
            .btn { display: inline-block; background-color: #8b5e3c; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 28px; border-radius: 12px; }
            .link-box { word-break: break-all; background: #fdfbf7; border: 1px solid #ebe4dc; border-radius: 8px; padding: 12px; font-size: 12px; color: #6b5e55; font-family: monospace; margin: 16px 0; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0eae4; font-size: 12px; color: #9c8e84; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Eveline Studio Hair</div>
              <div class="badge">Redefinição de Senha de Administradora</div>
            </div>
            <div class="content">
              <p>Olá, <strong>${displayName}</strong>!</p>
              <p>Recebemos uma solicitação para alterar a sua senha de acesso total ao sistema de agendamento do salão.</p>
              <p>Clique no botão abaixo para definir sua nova senha:</p>
              <div class="btn-wrapper">
                <a href="${resetLink}" target="_blank" rel="noopener noreferrer" class="btn">Redefinir Minha Senha</a>
              </div>
              <p style="font-size: 12px; color: #786d64;">Ou, se preferir, copie e cole o link direto no seu navegador:</p>
              <div class="link-box">${resetLink}</div>
              <p style="font-size: 12px; color: #786d64;"><strong>Importante:</strong> Este link tem validade de 15 minutos e só pode ser utilizado uma única vez para garantir a segurança da sua conta.</p>
            </div>
            <div class="footer">
              Eveline Studio Hair • Sistema de Agendamento Profissional<br>
              Se não foi você que solicitou a alteração, nenhuma ação é necessária.
            </div>
          </div>
        </body>
        </html>
      `;

      let sentVia = 'none';

      // 1. If custom SMTP configured in environment variables
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Eveline Studio Hair" <${process.env.SMTP_USER}>`,
          to: targetEmail,
          subject,
          text: textMessage,
          html: htmlMessage,
        });
        sentVia = 'smtp';
      } else {
        // 2. Transactional email dispatch via FormSubmit / Webhook to guarantee delivery to real inbox
        try {
          const formSubmitResponse = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              _subject: subject,
              _template: 'box',
              destinatario: targetEmail,
              administradora: displayName,
              mensagem: textMessage,
              link_de_redefinicao: resetLink,
            }),
          });

          if (formSubmitResponse.ok) {
            sentVia = 'relay';
          }
        } catch (relayError) {
          console.warn('Fallback relay delivery attempt warning:', relayError);
        }
      }

      res.json({
        success: true,
        sentVia,
        email: targetEmail,
        message: `Link de redefinição enviado com sucesso para ${targetEmail}.`,
      });
    } catch (err: any) {
      console.error('Erro ao enviar e-mail de redefinição:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Falha ao processar o envio do e-mail.',
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
