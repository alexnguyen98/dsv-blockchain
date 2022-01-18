import Address from './Address';
import { hashString } from './utils/hash';

/**
 * A fake implementation of public/private key.
 */
class UserKey {
  publicKey: string;
  privateKey: string;

  constructor(addr: Address, id: string) {
    this.privateKey = hashString(addr.toString() + id);
    this.publicKey = hashString(addr.toString() + id);
  }

  /**
   * Sign message with private key
   */
  static sign(msg: string, privateKey: string) {
    return hashString(msg + privateKey);
  }

  /**
   * Verify message with comparing calculated hash with signature
   */
  static verify(msg: string, signature: string, publicKey: string) {
    return hashString(msg + publicKey) === signature;
  }
}

export default UserKey;
