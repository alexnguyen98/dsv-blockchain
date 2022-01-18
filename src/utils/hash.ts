import * as crypto from 'crypto';

export const hashString = (str: string) => {
  return crypto.createHash('md5').update(str).digest('hex');
};
