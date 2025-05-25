import { Buffer } from 'node:buffer';
import { createHash, createDecipheriv } from 'node:crypto';

export function calculateSignature(token: string, timestamp: string, nonce: string, encryptedMsg: string): string {
  const params = [token, timestamp, nonce, encryptedMsg];
  params.sort(); // 字典序排序
  const joinedParams = params.join('');
  const hash = createHash('sha1');
  hash.update(joinedParams);
  return hash.digest('hex');
}

export function decryptMessage(encryptedBase64: string, encodingAESKey: string, expectedCorpId: string): string {
  // 1. 从 EncodingAESKey 计算实际的 AES Key
  // EncodingAESKey 本身并非直接的Base64，需要补齐'='再解码
  const aesKeyBuffer = Buffer.from(encodingAESKey + '=', 'base64');
  if (aesKeyBuffer.length !== 32) {
    throw new Error('无效的 EncodingAESKey：解码后长度不为32字节');
  }

  // 2. IV 是 AES Key 的前16字节
  const iv = aesKeyBuffer.subarray(0, 16);

  // 3. Base64 解码加密数据
  const encryptedDataBuffer = Buffer.from(encryptedBase64, 'base64');

  // 4. AES-256-CBC 解密
  const decipher = createDecipheriv('aes-256-cbc', aesKeyBuffer, iv);
  decipher.setAutoPadding(true); // 启用自动 PKCS#7 unpadding，这是默认行为

  let decryptedBuffer = Buffer.concat([
    decipher.update(encryptedDataBuffer),
    decipher.final(),
  ]);

  // 5. 解析解密后的数据结构： random(16B) + msg_len(4B) + msg + receive_id
  const msgLengthBuffer = decryptedBuffer.subarray(16, 20);
  const msgLength = msgLengthBuffer.readUInt32BE(0); // 网络字节序 (Big Endian)

  const msgStart = 20;
  const msgEnd = msgStart + msgLength;
  const message = decryptedBuffer.subarray(msgStart, msgEnd).toString('utf-8');

  const receiveId = decryptedBuffer.subarray(msgEnd).toString('utf-8');

  if (receiveId !== expectedCorpId) {
    throw new Error(`CorpID 不匹配。期望: ${expectedCorpId}, 得到: ${receiveId}`);
  }

  return message;
}