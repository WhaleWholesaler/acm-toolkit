# 推荐练习浏览器回归

`tree-picks.test.cjs` 使用真实页面、Playwright 和仓库自带的同步服务，覆盖批次保留、分方向推荐、旧数据迁移、双浏览器同账号同步与版本冲突合并。同步服务只监听本机随机端口，使用临时账号与临时数据目录，结束后自动清理。

需要 Node.js 18+ 和 Playwright。Windows 默认使用已安装的 Edge；其他平台使用 Playwright Chromium（先运行 `npx playwright install chromium`）。可用 `ACM_BROWSER_CHANNEL` 指定其他已安装的浏览器通道。

Windows 上可把测试依赖装在临时目录，不改前端的零运行时依赖结构：

```powershell
npm install --prefix "$env:TEMP\acm-toolkit-tests" --no-audit --no-fund --package-lock=false playwright
$env:NODE_PATH = "$env:TEMP\acm-toolkit-tests\node_modules"
node --test tests/tree-picks.test.cjs
```

如需指定测试同步服务的临时数据父目录，设置 `ACM_TEST_TMPDIR`；测试会在其中新建并清理自己的子目录。
