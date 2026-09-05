# ACM 训练台

面向 ACM/ICPC 选手的一站式训练工具：**算法模板库** + **知识技能树**，另提供原生 Windows 桌面版。

## 功能

### 📁 模板库（index.html）
- 选择本地模板目录（Chrome/Edge 文件系统 API，自动记忆），按一级子目录自动分类
- 新建模板：选分类 → 命名 → 粘贴代码或上传文件；支持拖拽上传、重命名、删除、编辑
- 拖拽排序（分类与模板），顺序持久化到 `.acm-order.json`
- 语法高亮（C/C++/Python/Java）、深浅主题、搜索
- **一键整理打印**：自定义标题/栏数/字号，生成封面+目录+正文的 A4 打印视图，双栏自动横向，可另存 PDF

### 🌳 知识技能树（skilltree.html）
- 五大板块（基础·搜索·构造 / 动态规划 / 图论与数据结构 / 数学·博弈·几何 / 字符串与杂项）
- 铜/银/金/了解 四层分级，按巩固值（练习量 × 自评 × 记忆保持）着色
- 刷题记录、奖牌就绪度估算、建议攻克与复习推荐、板块雷达
- 与模板库双向关联：知识点 ⇆ 模板文件，一键互跳
- 夜间模式、导出/导入 JSON 备份

## 使用

### Web 版（零依赖）
双击 `index.html`（Chrome/Edge）。技能树以 iframe 加载 `skilltree.html`，两文件需同目录。

### Windows 桌面版（单 exe）
`native/dist/ACM训练台.exe`（或 Releases 页下载）。首次运行自动解压资源到 `%LOCALAPPDATA%\ACMToolkit`，无安装、无依赖（需 Windows 10/11 自带 WebView2 运行时）。

## 从源码构建桌面版

```powershell
cd native
powershell -ExecutionPolicy Bypass -File build.ps1
```

产物输出到 `native/dist/ACM训练台.exe`。构建使用系统自带 C# 编译器（.NET Framework 4.8），WebView2 SDK 程序集已在 `native/lib/`。

## 数据说明

- 模板文件存储在你自己的本地目录中，程序只负责索引与整理
- 技能树进度、主题偏好、知识点↔模板关联存于浏览器 localStorage（Web 版）或 WebView2 用户数据（桌面版）；换环境请用技能树的「导出 JSON」迁移
- Web 版与桌面版存储相互独立，首次切换需重新选择模板目录

## License

MIT
