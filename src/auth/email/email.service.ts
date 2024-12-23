import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, 
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, templateName: string, templateData: any): Promise<void> {
    try {
        // Dosya yolunu belirle
        const templatePath = path.join(process.cwd(), 'src', 'template', 'HTML', `${templateName}.html`);
        // Şablon dosyasını oku
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Placeholder'ları veriyle değiştir
        Object.keys(templateData).forEach(key => {
            const placeholder = `{{${key}}}`;
            htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), templateData[key]);
        });

        // E-posta gönderme işlemi
        const info = await this.transporter.sendMail({
            from: `"Soru Cevap" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        // Hatanın 550 koduna ait olup olmadığını kontrol et
        if (error.message.includes('550')) {
            throw new HttpException('E-posta gönderilemedi, geçersiz e-posta adresi.', HttpStatus.BAD_REQUEST);
        }

        // Diğer hatalar için
        throw new HttpException('E-posta gönderilemedi, lütfen tekrar deneyin.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}


}
