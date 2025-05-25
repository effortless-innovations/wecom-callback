import Bun from 'bun';
import { Buffer } from 'node:buffer';
import { createHash, createDecipheriv } from 'node:crypto';

const TOKEN = Bun.env["TOKEN"] ?? '';
const ENCODING_AES_KEY = Bun.env["ENCODING_AES_KEY"] ?? ''; // 43位字符串
const CORP_ID = Bun.env["CORP_ID"] ?? '';

if (ENCODING_AES_KEY.length !== 43) {
  console.error("错误：EncodingAESKey 必须是43个字符！");
  process.exit(1);
}

console.log("企业微信回调服务启动中 ...");
console.log(`URL: http://172.17.0.1:3000/`);
console.log("请确保 Token, EncodingAESKey, 和 CorpID 已正确配置。");

function calculateSignature(token: string, timestamp: string, nonce: string, encryptedMsg: string): string {
  const params = [token, timestamp, nonce, encryptedMsg];
  params.sort(); // 字典序排序
  const joinedParams = params.join('');
  const hash = createHash('sha1');
  hash.update(joinedParams);
  return hash.digest('hex');
}

function decryptMessage(encryptedBase64: string, encodingAESKey: string, expectedCorpId: string): string {
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


Bun.serve({
  port: 3000,
  fetch(req: Request) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/") {
      const queryParams = url.searchParams;
      const msg_signature = queryParams.get("msg_signature");
      const timestamp = queryParams.get("timestamp");
      const nonce = queryParams.get("nonce");
      const echostr_encrypted = queryParams.get("echostr"); // 已URL解码

      console.log("收到GET请求进行URL验证 (手动):");
      console.log(`  msg_signature: ${msg_signature}`);
      console.log(`  timestamp: ${timestamp}`);
      console.log(`  nonce: ${nonce}`);
      console.log(`  echostr_encrypted (URL解码后): ${echostr_encrypted}`);

      if (!msg_signature || !timestamp || !nonce || !echostr_encrypted) {
        console.error("请求参数缺失");
        return new Response("请求参数缺失", { status: 400 });
      }

      try {
        const calculatedSignature = calculateSignature(TOKEN, timestamp, nonce, echostr_encrypted);
        if (calculatedSignature !== msg_signature) {
          console.error(`签名校验失败。计算得到: ${calculatedSignature}, 微信传入: ${msg_signature}`);
          return new Response("签名校验失败", { status: 401 });
        }
        // console.log("签名校验成功");

        const decryptedEchoStr = decryptMessage(echostr_encrypted, ENCODING_AES_KEY, CORP_ID);
        // console.log(`echostr 解密成功: "${decryptedEchoStr}"`);

        return new Response(decryptedEchoStr);
      } catch (error: unknown) {
        console.error("URL验证处理失败 (手动):", error);
        return new Response(`验证处理失败: ${JSON.stringify(error)}`, { status: 500 });
      }
    }
    return new Response("路径未找到或方法不支持", { status: 404 });
  },
  error(error: Error) {
    console.error("服务器错误 (手动):", error);
    return new Response("服务器内部错误", { status: 500 });
  },
});

console.log(`手动实现的 Bun HTTP server running on http://0.0.0.0:3000`);
