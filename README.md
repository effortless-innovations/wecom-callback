# wecom-callback

> 纯 Bun.js 编写的企业微信回调服务

## 一、环境变量
将 .env.example 复制一份，并重命名为 .env
```shell
cp .env.example .env
```
填写企业微信里的TOKEN、ENCODING_AES_KEY 和 CORPID

## 二、构建镜像
```shell
docker build -t wecom-callback -f Dockerfile --no-cache .
```
## 三、运行容器
```shell
docker run -d -p 3009:3000 --restart=unless-stopped --env-file .env --name wecom wecom-callback:latest
```
## 四、配置Nginx
```shell
server {
    listen       80;
    listen  [::]:80;
    server_name  wecom.your-demain.com;
    location / {
      # 172.17.0.1 is docker's IP
      proxy_pass http://172.17.0.1:3009;
    }
}
```