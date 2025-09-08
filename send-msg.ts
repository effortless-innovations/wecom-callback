import Bun from "bun";

interface AccessTokenResponse {
  errcode: number;
  errmsg: string;
  access_token?: string;
  expires_in?: number;
}

interface SendMessageResponse {
  errcode: number;
  errmsg: string;
  invaliduser?: string;
  invalidparty?: string;
  invalidtag?: string;
}

interface TextMessage {
  content: string;
}

interface SendMessageBody {
  touser: string;
  toparty?: string;
  totag?: string;
  msgtype: "text";
  agentid: number;
  text: TextMessage;
  safe?: 0 | 1;
  enable_id_trans?: 0 | 1;
  enable_duplicate_check?: 0 | 1;
}

const CONFIG = {
  CORP_ID: Bun.env["CORP_ID"],
  CORP_SECRET: Bun.env["CORP_SECRET"],
  AGENT_ID: Number(Bun.env["AGENT_ID"]),
};

async function getAccessToken(): Promise<string> {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CONFIG.CORP_ID}&corpsecret=${CONFIG.CORP_SECRET}`;

  try {
    const response = await fetch(url, {method: "GET"});
    const data: AccessTokenResponse = await response.json() as AccessTokenResponse;

    if (data.errcode === 0 && data.access_token) {
      console.log("✅ access_token 获取成功");
      return data.access_token;
    } else {
      throw new Error(`获取 access_token 失败: ${data.errmsg}`);
    }
  } catch (error) {
    console.error("💥 获取 access_token 异常:", error);
    throw error;
  }
}

async function sendTextMessage(
  accessToken: string,
  message: string,
  options: {
    touser?: string;
    toparty?: string;
    totag?: string;
  } = {}
): Promise<SendMessageResponse> {
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;

  const body: SendMessageBody = {
    touser: options.touser ?? "@all",
    toparty: options.toparty,
    totag: options.totag,
    msgtype: "text",
    agentid: CONFIG.AGENT_ID,
    text: {content: message},
    safe: 0,
    enable_id_trans: 0,
    enable_duplicate_check: 0,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    });

    const result: SendMessageResponse = await response.json() as SendMessageResponse;

    if (result.errcode === 0) {
      console.log("✅ 消息发送成功");
    } else {
      console.error("❌ 消息发送失败:", result.errmsg);
    }

    return result;
  } catch (error) {
    console.error("💥 发送消息异常:", error);
    throw error;
  }
}

async function main() {
  console.log("⏳ 开始执行企业微信消息发送...");

  try {
    const accessToken = await getAccessToken();
    const message = `Hello from Bun.js + TypeScript 🚀\n当前时间: ${new Date().toLocaleString()}`;

    const result = await sendTextMessage(accessToken, message, {
      touser: "kenny|TuoLeiSi", // @all，也可改为指定成员ID，如 "kenny|TuoLeiSi"
    });

    console.log("🎉 操作完成，响应:", result);
  } catch (error) {
    console.error("❌ 主流程执行失败:", error);
  }
}

main();
