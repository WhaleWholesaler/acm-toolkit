# ACM 训练台 · 服务器部署手册（交给服务器 AI 执行）

> **前置**：用户已把整个项目上传到服务器，假设目录为 `/opt/acm-toolkit`（内含 `server/server.js`、`index.html`、`js/` 等）。
> 若实际路径不同，把下文中所有 `/opt/acm-toolkit` 替换为实际路径即可。
>
> **目标**：部署同步服务并**同源托管前端**，交付一个 HTTPS 地址。队友打开该地址即可使用 Web 版并自动多设备同步。

---

## 一、交付物

1. 后台常驻服务：`server.js` 只监听 `127.0.0.1:8787`（Node 18+ 或 Docker 均可）
2. 前端与 API 同一个 HTTPS 域名（Caddy 反代 + sslip.io 免费域名；或用 Cloudflare Tunnel）
3. 通过第四节**全部验收项**
4. 按第五节模板汇报最终地址

## 二、硬性约束

- 公网只开 `80/443`；`8787` 绝不能暴露公网（服务已配 `HOST=127.0.0.1`）
- 不改动服务器上已有服务/端口/全局防火墙策略；软件只用发行版官方源或官方软件源
- **不要注册任何第三方账号、不要绑定支付**；Cloudflare Tunnel 仅在用户提供了已托管 Cloudflare 的域名时使用，否则汇报等待
- 公网必须 HTTPS；纯 HTTP 仅限内网临时测试
- 不要删除数据目录 `/var/lib/acm-sync`；不要手工编辑其中正在被服务使用的 JSON

## 三、步骤 1：环境勘察（先做，记录结果）

```bash
ls /opt/acm-toolkit/server/server.js && echo OK   # 确认项目已上传
uname -a; cat /etc/os-release | head -5
id
node -v 2>/dev/null; docker -v 2>/dev/null
curl -s https://api.ipify.org; echo               # 公网出口 IP
ss -ltnp | grep -E ':80|:443|:8787' || true
ufw status 2>/dev/null || firewall-cmd --state 2>/dev/null || true
```

- `node -v` ≥ 18 → 走第 4.2 节（推荐）
- 否则有 Docker → 走第 4.3 节
- 都没有 → 先按 4.2 安装 Node 20，失败再考虑 Docker

并请用户确认：**云控制台安全组已放行 80、443**（你无权操作时在汇报中注明）。

## 四、步骤 2：部署服务

### 4.1 准备用户/目录/权限

```bash
sudo groupadd -f acmsync
sudo useradd --system --gid acmsync --home-dir /opt/acm-toolkit --shell /usr/sbin/nologin acmsync 2>/dev/null || true
sudo mkdir -p /var/lib/acm-sync
sudo chown -R acmsync:acmsync /var/lib/acm-sync
sudo chmod -R a+rX /opt/acm-toolkit          # 让服务用户能读前端静态文件
```

### 4.2 Node 直装 + systemd（推荐）

若没有 Node 18+（Debian/Ubuntu）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # 应为 v20.x
```

安装服务单元（仓库里已备好 `server/acm-sync.service`，直接复制使用）：

```bash
sudo cp /opt/acm-toolkit/server/acm-sync.service /etc/systemd/system/acm-sync.service
sudo systemctl daemon-reload
sudo systemctl enable --now acm-sync
systemctl status acm-sync --no-pager
```

自检：

```bash
curl -s http://127.0.0.1:8787/api/health
# 期望：{"ok":true,"time":...,"register":"open"}
curl -sI http://127.0.0.1:8787/ | head -1     # 期望：HTTP/1.1 200 OK（同源托管前端）
```

### 4.3 Docker 部署（备选）

```bash
cd /opt/acm-toolkit/server
# 若要同源托管前端：把 docker-compose.yml 中 `- ..:/www:ro` 和 `STATIC_DIR=/www` 两行注释打开
sudo docker compose up -d --build
sudo docker compose ps
curl -s http://127.0.0.1:8787/api/health
```

### 4.4 常见启动失败

```bash
journalctl -u acm-sync -n 100 --no-pager        # systemd
sudo docker compose logs --tail=100              # docker
```

确认 `server.js` 路径与 `acm-sync.service` 中一致；8787 未被占用。

## 五、步骤 3：HTTPS

### 5.1 放行端口

```bash
sudo ufw allow 80/tcp; sudo ufw allow 443/tcp        # 有 ufw 时
# 或：sudo firewall-cmd --permanent --add-service=http --add-service=https && sudo firewall-cmd --reload
```

云安全组放行 80/443（用户确认；你有权限也可直接操作）。

### 5.2 安装 Caddy（Debian/Ubuntu 官方源）

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

### 5.3 配置反向代理

```bash
IP=$(curl -s https://api.ipify.org)
sudo sed "s/<公网IP>/$IP/" /opt/acm-toolkit/server/Caddyfile.example | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 5.4 验证

```bash
IP=$(curl -s https://api.ipify.org)
curl -s https://$IP.sslip.io/api/health          # 期望 {"ok":true,...}
curl -s https://$IP.sslip.io/ | grep -o '<title>[^<]*'   # 期望 ACM 模板整理与打印
```

两者都正常 → **HTTPS 地址即 `https://<IP>.sslip.io`**，把它写进汇报。

排障（证书失败 / 超时 / 从手机流量也打不开）：

```bash
sudo journalctl -u caddy -n 80 --no-pager
curl -sI -m 5 http://$IP/.well-known/acme-challenge/ping
```

大概率是 80/443 被运营商拦截（国内未备案机房常见）。把命令输出写进汇报，并转 5.5。

### 5.5 备选：Cloudflare Tunnel（仅在用户提供域名后执行）

前置：用户已把域名托管到 Cloudflare 免费套餐。没有就停止并汇报等待，**不要自行注册账号**。

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# 全部用 sudo：凭据统一落在 /root/.cloudflared，与以 root 运行的 cloudflared 服务一致
sudo cloudflared tunnel login          # 会在终端给出授权链接，需用户在浏览器完成；无法完成则汇报等待
sudo cloudflared tunnel create acm
TUNNEL_ID=$(sudo ls /root/.cloudflared/*.json 2>/dev/null | head -1 | xargs -r -n1 basename | sed 's/\.json$//')
echo "tunnel id: $TUNNEL_ID"           # 应为 UUID；为空说明 create 没成功，停止并汇报
sudo cloudflared tunnel route dns acm acm.<用户域名>
sudo mkdir -p /etc/cloudflared
sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json
ingress:
  - hostname: acm.<用户域名>
    service: http://127.0.0.1:8787
  - service: http_status:404
EOF
sudo cloudflared service install
sudo systemctl enable --now cloudflared
curl -s https://acm.<用户域名>/api/health
```

## 六、步骤 4：验收清单（必须全部通过）

```bash
API=https://<最终地址，不带斜杠>
USER_ID=<注册响应里的 user.id>
TOKEN=<注册响应里的 token>

# 1. 服务健康
curl -s $API/api/health

# 2. 同源前端可访问
curl -s $API/ | grep -o '<title>[^<]*'
curl -sI $API/js/sync.js | head -1          # 期望 200

# 3. 注册测试账号
curl -s -X POST $API/api/register -H 'Content-Type: application/json' \
  -d '{"username":"deploytest","password":"deploytest123"}'

# 4. 初始 rev=0
curl -s $API/api/spaces/u_$USER_ID/state -H "Authorization: Bearer $TOKEN"

# 5. 首次推送 rev=1
curl -s -X PUT $API/api/spaces/u_$USER_ID/state -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"baseRev":0,"doc":{"v":1,"keys":{"skilltree_theme":"dark"},"meta":{}}}'

# 6. 旧版本重推 → 必须 409 且返回最新 doc
curl -s -X PUT $API/api/spaces/u_$USER_ID/state -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"baseRev":0,"doc":{"v":1,"keys":{},"meta":{}}}'

# 7. 重启后数据仍在（rev 仍为 1）
#    systemd：
sudo systemctl restart acm-sync && sleep 1
#    Docker：
#    cd /opt/acm-toolkit/server && sudo docker compose restart && sleep 2
curl -s $API/api/spaces/u_$USER_ID/state -H "Authorization: Bearer $TOKEN"

# 8. 8787 不对外：服务只绑 127.0.0.1，本机 curl 公网 IP 必然失败，不能作为安全依据；
#    请用手机流量 / 另一台机器访问 http://<公网IP>:8787/api/health（应超时），
#    并检查云安全组确实未放行 8787。
```

清理测试账号（先停服，避免内存覆盖）：

```bash
CLEAN_JS='
const fs=require("fs"),d=process.env.DATA_DIR;
const a=JSON.parse(fs.readFileSync(d+"/accounts.json"));
const id=a.byName["deploytest"];
if(id){delete a.users[id];delete a.byName["deploytest"];
fs.writeFileSync(d+"/accounts.json",JSON.stringify(a));
try{fs.unlinkSync(d+"/state_u_"+id+".json")}catch(e){}
console.log("cleaned",id)}
'

# systemd：
sudo systemctl stop acm-sync
sudo -u acmsync env DATA_DIR=/var/lib/acm-sync node -e "$CLEAN_JS"
sudo systemctl start acm-sync

# Docker：
cd /opt/acm-toolkit/server && sudo docker compose down
sudo docker run --rm -v "$PWD/data:/data" -e DATA_DIR=/data node:20-alpine node -e "$CLEAN_JS"
sudo docker compose up -d
```

## 七、步骤 5：汇报模板

```
部署结果：成功 / 失败（原因）
访问地址：https://xxxx        （前端 + API 同一个地址）
HTTPS 方案：A(sslip.io + Caddy) / B(Cloudflare Tunnel)
运行方式：systemd / docker compose
Node 版本：
数据目录：/var/lib/acm-sync
开机自启：是 / 否
验收清单：8 项全过 / 第 N 项失败（附输出）
测试账号：deploytest 已清理 / 未清理
遗留问题或风险：
```

汇报后不要再改配置；GitHub Pages 等前端其它入口由用户侧决定。

## 八、常见问题

| 现象 | 处理 |
| --- | --- |
| `node -v` < 18 或找不到 | 按 4.2 用 NodeSource 装 Node 20；或改走 Docker |
| 页面 403 / 无法读取前端 | `chmod -R a+rX /opt/acm-toolkit`，确认 `STATIC_DIR` 指向项目根 |
| Caddy 证书失败 | 检查 80/443 公网可达、`journalctl -u caddy`；大陆未备案机房转 5.5 |
| `/api/*` 返回 401 | 请求少了 `Authorization: Bearer <token>`，或登录已过期（30 天） |
| 忘记密码 | systemd：停服后 `sudo -u acmsync env DATA_DIR=/var/lib/acm-sync node /opt/acm-toolkit/server/server.js --reset-password <用户名> <新密码>`，再启服。Docker：`cd /opt/acm-toolkit/server && sudo docker compose stop && sudo docker compose run --rm acm-sync node server.js --reset-password <用户名> <新密码> && sudo docker compose start` |
| 启动报 `FATAL: ...损坏` 并退出 | 某个数据 JSON 损坏：服务已自动把它改名为 `*.corrupt-<时间戳>` 备份并拒绝启动（避免空库覆盖）。用每日备份恢复对应文件、属主改回 `acmsync` 后重启 |
| 想关闭开放注册 | 把 unit 里 `REGISTER_MODE=open` 改为 `invite` 并配 `INVITE_CODES=码1,码2`，或 `closed`，然后 `systemctl daemon-reload && systemctl restart acm-sync` |

## 九、数据与备份

- 数据是 `*.json`（账号、会话、团队、各空间状态）
  - systemd：`/var/lib/acm-sync/`
  - Docker：`/opt/acm-toolkit/server/data/`
- 备份：
  ```bash
  # systemd
  sudo tar czf /root/acm-sync-backup-$(date +%F).tar.gz -C /var/lib acm-sync
  # Docker
  cd /opt/acm-toolkit/server && sudo tar czf /root/acm-sync-backup-$(date +%F).tar.gz data
  ```
- 恢复：停服 → 解压覆盖 → systemd 需 `sudo chown -R acmsync:acmsync /var/lib/acm-sync`（Docker 保持 root 属主即可）→ 启服
- 建议加每日自动备份（`crontab -e`）：
  ```cron
  10 4 * * * tar czf /root/acm-sync-$(date +\%F).tar.gz -C /var/lib acm-sync
  ```
- 环境变量速查见同目录 `README.md`
