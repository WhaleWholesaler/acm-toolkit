# ACM 训练台同步服务

零依赖 Node（18+）账号与进度同步服务：个人进度 / 团队共享进度，客户端负责合并，服务端负责鉴权与版本控制。

> 把服务器部署交给 AI 执行？直接用 [`DEPLOY.md`](DEPLOY.md)（假设项目已上传到 `/opt/acm-toolkit`，步骤式手册）。

## 本地运行

```bash
node server.js
# 默认 http://127.0.0.1:8787，数据写到 server/data/
```

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8787` | 监听端口 |
| `DATA_DIR` | `./data` | 数据目录（JSON 文件，备份它即可） |
| `REGISTER_MODE` | `open` | `open` 开放注册 / `invite` 邀请码 / `closed` 关闭注册 |
| `INVITE_CODES` | 空 | `invite` 模式下的邀请码，逗号分隔，每个只能用一次 |
| `ALLOWED_ORIGINS` | `*` | 允许的前端来源，逗号分隔；建议设为你的 Pages 域名 |
| `TRUST_PROXY` | 关 | 置于 Caddy/Cloudflare 反代之后时设为 `1`，按 `X-Forwarded-For` 末位取真实 IP（限流用） |
| `SESSION_DAYS` | `30` | 登录有效期（天） |
| `STATIC_DIR` | 空 | 可选：同源托管前端静态文件（填仓库根目录即可） |

重置某个用户的密码（服务器上执行）：

```bash
node server.js --reset-password <用户名> <新密码>
```

## 部署到你的服务器

### 方式一：Node + systemd + Caddy（推荐，自动 HTTPS）

仓库已备好可直接使用的 `acm-sync.service`（`HOST=127.0.0.1`、`STATIC_DIR` 同源托管前端），完整步骤与验收见 [`DEPLOY.md`](DEPLOY.md)。核心命令：

```bash
sudo groupadd -f acmsync
sudo useradd --system --gid acmsync --home-dir /opt/acm-toolkit --shell /usr/sbin/nologin acmsync 2>/dev/null || true
sudo mkdir -p /var/lib/acm-sync && sudo chown -R acmsync:acmsync /var/lib/acm-sync
sudo cp /opt/acm-toolkit/server/acm-sync.service /etc/systemd/system/acm-sync.service
sudo systemctl daemon-reload && sudo systemctl enable --now acm-sync
```

Caddy（`/etc/caddy/Caddyfile`，需要一个解析到你服务器的域名，证书自动签发）：

```
acm.example.com {
    reverse_proxy 127.0.0.1:8787
}
```

### 方式二：Docker

```bash
cd server
docker compose up -d --build
```

### 方式三：没有域名

浏览器要求 HTTPS 页面只能调用 HTTPS 接口（GitHub Pages 是 HTTPS），所以 API 也必须 HTTPS。没域名有两种走法：

**A. sslip.io 免费域名（零成本，需要公网 IP 且 80/443 可直连）**

`sslip.io` 会把 `<你的IP>.sslip.io` 自动解析到该 IP，Caddy 可据此自动签证书：

```
<你的服务器IP>.sslip.io {
    reverse_proxy 127.0.0.1:8787
}
```

前端 `js/sync-config.js` 填 `https://<你的服务器IP>.sslip.io`。

注意：国内部分机房 80/443 未备案会被运营商拦截，若访问不通改用方案 B。

**B. 便宜域名 + Cloudflare Tunnel（无需开放任何端口，适合无备案 / 内网 / NAT）**

1. 买一个便宜域名（几块到几十块一年），托管到 Cloudflare 免费套餐
2. 服务器安装 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)，然后：

```bash
cloudflared tunnel login
cloudflared tunnel create acm
cloudflared tunnel route dns acm acm.example.com
cloudflared tunnel run --url http://127.0.0.1:8787 acm
```

3. 临时测试可用 `cloudflared tunnel --url http://127.0.0.1:8787`（每次重启 URL 会变，仅限测试）

前端 `js/sync-config.js` 填 `https://acm.example.com`。

> 只想局域网/内网用：直接 `STATIC_DIR` 同源托管，队友访问 `http://<内网IP>:8787/` 即可，但不要这样在公网明文传密码。

## 前端部署

### GitHub Pages（队友访问入口）

仓库根目录就是静态站点：仓库 Settings → Pages → Source 选 `Deploy from a branch`、分支 `main`、目录 `/ (root)`。
访问 `https://<你的用户名>.github.io/acm-toolkit/` 即可。

把 API 地址写进 `js/sync-config.js`：

```js
window.ACM_SYNC_API = 'https://acm.example.com';
```

或者不改文件，在页面右上角「☁ 未登录」弹窗里填写服务器地址（保存在本机）。

### 同源托管

给服务加 `STATIC_DIR=<仓库根目录>`，直接访问服务地址即可，前端与 API 同源，无需配置地址。

## 同步机制

- 同步键：技能树进度、模板关联、抽题历史、当前批次、抽取范围、主题等偏好（设备特有的模板目录句柄不同步）
- 推送：本地改动 2.5 秒防抖后自动推送；断网自动重试；关闭页面前 keepalive 兜底
- 拉取：登录/切换空间时拉取，之后每 2 分钟或窗口重新聚焦时增量拉取
- 冲突：`rev` 乐观锁；版本冲突时拉取云端、按「日志并集去重 + 等级/备注取时间较新一侧」合并后重推
- 空间：每个用户有自己的「个人」空间；团队空间所有成员共享，创建团队会生成邀请码

## 安全建议

- 生产环境设置 `ALLOWED_ORIGINS` 为你的前端域名
- 前面挂 HTTPS 反代；不要把 8787 直接暴露公网
- 定期备份 `DATA_DIR`；登录令牌只存在浏览器本机
