import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // Örneğin: smtp.gmail.com
      port: parseInt(process.env.EMAIL_PORT, 10), // Örneğin: 587
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // E-posta kullanıcı adı
        pass: process.env.EMAIL_PASS, // E-posta şifresi
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const info = await this.transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`, // Gönderen adresi
      to, // Alıcı adresi
      subject, // E-posta konusu
      text, // E-posta içeriği (düz metin)
      html, // E-posta içeriği (HTML)
    });

    console.log('Message sent: %s', info.messageId);
  }
}
