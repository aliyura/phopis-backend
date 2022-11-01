import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM;
const secretKey = process.env.ENCRYPTION_SECRETKEY;
const iv = crypto.randomBytes(16);

@Injectable()
export class CryptoService {
  saltRounds = 10;

  async encryptPassword(text: string): Promise<string> {
    const salt = await bcrypt.genSaltSync(this.saltRounds);
    const hash = await bcrypt.hashSync(text, salt);
    return hash;
  }

  async comparePassword(cipher: string, plainText: string): Promise<boolean> {
    return await bcrypt.compareSync(plainText, cipher);
  }

  encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
    };
  };

  decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(
      algorithm,
      secretKey,
      Buffer.from(hash.iv, 'hex'),
    );

    const decrpyted = Buffer.concat([
      decipher.update(Buffer.from(hash.content, 'hex')),
      decipher.final(),
    ]);

    return decrpyted.toString();
  };
}
