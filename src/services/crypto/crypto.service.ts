import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const algorithm = process.env.ENCRYPTION_ALGORITHM;
const secretKey = process.env.ENCRYPTION_SECRETKEY;
const iv = crypto.randomBytes(16);

@Injectable()
export class CryptoService {
  saltRounds = 10;

  async encrypt(text: string): Promise<string> {
    const salt = await bcrypt.genSaltSync(this.saltRounds);
    const hash = await bcrypt.hashSync(text, salt);
    return hash;
  }

  async compare(cipher: string, plainText: string): Promise<boolean> {
    return await bcrypt.compareSync(plainText, cipher);
  }
}
