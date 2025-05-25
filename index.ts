import Bun from 'bun';
import { calculateSignature, decryptMessage } from './utils';

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
