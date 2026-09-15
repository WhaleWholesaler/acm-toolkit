
/* ================= 知识树数据 =================
   id, p(父), n(名称), t(0 非叶 / 1 铜 / 2 银 / 3 金 / 4 了解), tg(目标题数),
   dir(方向 a通用 g图论DS m数学 d DP字符串, 可在类别上设置后继承), d(说明), s(识别信号), pr(推荐题) */
const RAW=[
{id:'root',p:null,n:'ACM 知识技能树',t:0},

/* ================= Ⅰ 基础 · 搜索 · 构造 ================= */
{id:'b_base',p:'root',n:'Ⅰ 基础 · 搜索 · 构造',t:0,dir:'a'},
{id:'c_basic',p:'b_base',n:'基础技巧',t:0},
{id:'s_seq',p:'c_basic',n:'序列基本功',t:0},
{id:'prefix',p:'s_seq',n:'前缀和 / 差分',t:1,tg:5,d:'一维/二维前缀和与差分数组；把互相独立的操作拆成对每个位置的贡献。',s:'区间加后一次查询；矩形加；操作互不影响',pr:'P3397 地毯; P1719 最大加权矩形; P2280 激光炸弹'},
{id:'hiprefix',p:'prefix',n:'高维前缀和 / 差分',t:2,tg:3,d:'三维及以上用容斥式递推；差分是前缀和的逆运算，树上差分见"树上问题"。',s:'立方体区域求和；多维区间同时加',pr:'P2280 二维; CF 1500~1700 前缀和 tag; AtCoder ABC 3D 前缀和'},
{id:'twoptr',p:'s_seq',n:'双指针 / 二分答案',t:1,tg:5,d:'滑动窗口利用单调性；"最大值最小"类问题二分答案后 O(n) 判定。',s:'最短/最长满足条件的子段；至少 k 次能否…；最大值最小',pr:'P1638 逛画展; P2678 跳石头; P1182 数列分段 Section II'},
{id:'mono',p:'s_seq',n:'单调栈 / 单调队列',t:1,tg:6,d:'每个元素作为最值的管辖区间；定长窗口最值；DP 转移窗口优化。',s:'所有子区间最值之和；滑动窗口；左/右第一个更大的元素',pr:'P5788 单调栈; P1886 滑动窗口; P1901 发射站'},
{id:'cartesian',p:'mono',n:'笛卡尔树',t:2,tg:3,d:'O(n) 建树，子树对应"以该元素为最值的极大区间"，可按最值分治。',s:'区间最值分治；子区间最值统计；按最大值划分',pr:'P5854 笛卡尔树; P1377 树的序'},
{id:'discretize',p:'s_seq',n:'离散化 / 排序技巧',t:1,tg:4,d:'值域压缩后再上数据结构；sort+unique+lower_bound 三件套；按多关键字排序化简问题。',s:'值域 1e9 但 n 1e5；只关心相对大小',pr:'P1908 逆序对; P1496 火烧赤壁; P1177 排序'},
{id:'stl',p:'s_seq',n:'STL 与 pbds 技巧',t:1,tg:4,d:'set/multiset 维护有序集合、priority_queue、pbds 的 tree/优先队列；用对容器省下一个数据结构。',s:'动态插入删除 + 查前驱后继/第 k 小；懒删除',pr:'P1801 黑匣子; P3369 普通平衡树 (pbds); P1090 合并果子'},
{id:'s_bin',p:'c_basic',n:'二分与三分',t:0},
{id:'binans',p:'s_bin',n:'二分答案与判定函数',t:1,tg:5,d:'答案单调时二分，把最优化转成判定；注意边界、实数二分、判定函数的贪心。',s:'最大化最小值 / 最小化最大值；"能否在 k 次内完成"',pr:'P1873 砍树; P2440 木材加工; P3853 路标设置; P1281 书的复制'},
{id:'fracprog',p:'binans',n:'分数规划',t:2,tg:3,d:'二分比值 λ，判定 Σ(a_i − λ b_i) ≥ 0；结合背包 / 生成树 / 最小圈。',s:'最大化 Σa/Σb；平均值最大的子集/环',pr:'P4377 Talent Show; P3199 最小圈; P4322 最佳团体'},
{id:'ternary',p:'s_bin',n:'三分 / 整数三分',t:2,tg:3,d:'单峰函数求极值；整数域三分注意平台段；嵌套三分处理二维。',s:'凸/凹函数极值；参数化后单峰',pr:'P3382 三分法; P1883 函数; CF 1500~1800 三分'},
{id:'s_greedy',p:'c_basic',n:'贪心',t:0},
{id:'greedy',p:'s_greedy',n:'经典贪心模型',t:1,tg:6,d:'区间调度、哈夫曼、排队接水、邻项交换（国王游戏）；证明用交换论证。',s:'选最多不相交区间；排序后按某种顺序处理最优',pr:'P1090 合并果子; P1803 线段覆盖; P1223 排队接水; P1080 国王游戏'},
{id:'exchange',p:'greedy',n:'反悔贪心',t:2,tg:4,d:'先贪心选，用堆保留"反悔"的机会；选 k 个、有截止时间的任务调度。',s:'任务有 deadline 和收益；选了可以换掉',pr:'P2949 工作调度; P4053 建筑抢修; P1484 种树'},
{id:'s_bitenum',p:'c_basic',n:'位运算与枚举',t:0},
{id:'bitops',p:'s_bitenum',n:'位运算技巧',t:1,tg:4,d:'按位独立拆贡献；lowbit；__builtin 系列；异或性质（自反、前缀异或）。',s:'按位统计；异或和；与/或的单调性',pr:'P1582 倒水; P2114 起床困难综合症; CF 1300~1600 位运算'},
{id:'subsetenum',p:'s_bitenum',n:'子集 / 排列枚举',t:1,tg:3,d:'for(s=m;s;s=(s-1)&m) 枚举子集；next_permutation；枚举顺序与剪枝结合。',s:'n ≤ 20 全部子集；n ≤ 10 全排列',pr:'P1036 选数; P2036 Perket; P1706 全排列'},
{id:'meetmid',p:'subsetenum',n:'折半搜索 (Meet in the Middle)',t:2,tg:4,d:'n ≈ 40 时两半各 2^20，排序 / 哈希合并；注意去重与统计方式。',s:'n 在 30~45；2^n 爆但 2^(n/2) 可以',pr:'P4799 世界冰球锦标赛; P3067 Balanced Cow Subsets; P2962 灯 Lights'},

{id:'c_search',p:'b_base',n:'搜索',t:0},
{id:'s_search1',p:'c_search',n:'搜索基础',t:0},
{id:'dfsbfs',p:'s_search1',n:'DFS / BFS 枚举',t:1,tg:5,d:'回溯框架、状态表示、BFS 求最少步数；写好 vis 与还原现场。',s:'求所有方案；网格最短步数',pr:'P1219 八皇后; P1605 迷宫; P1443 马的遍历'},
{id:'memo',p:'s_search1',n:'记忆化搜索',t:1,tg:4,d:'DP 的递归写法，天然处理拓扑顺序；状态用 map 记忆时注意开销。',s:'转移方向不明显的 DP；状态稀疏',pr:'P1434 滑雪; P1464 Function; P1057 传球游戏'},
{id:'prune',p:'s_search1',n:'剪枝技巧',t:1,tg:5,d:'可行性剪枝、最优性剪枝、搜索顺序、对称性去重、上下界估价。',s:'NP 类小规模问题；n ≤ 30 但暴力超时',pr:'P1120 小木棍; P1731 生日蛋糕; P1074 靶形数独'},
{id:'s_search2',p:'c_search',n:'搜索进阶',t:0},
{id:'idastar',p:'s_search2',n:'迭代加深 / IDA*',t:2,tg:3,d:'限制深度逐层加深；配合可采纳估价函数剪枝。',s:'答案步数小但分支大；给出步数上限',pr:'P2324 骑士精神; P1379 八数码; P2534 铁盘整理'},
{id:'bidir',p:'s_search2',n:'双向 BFS',t:2,tg:3,d:'从起点终点同时扩展，状态数从 b^d 降到 2·b^(d/2)。',s:'起终点明确且步数上限 ≤ 10；状态空间巨大',pr:'P1032 字串变换; P1379 八数码; CF 1600~1900 状态搜索'},
{id:'dlx',p:'s_search2',n:'舞蹈链 DLX（了解）',t:4,tg:2,d:'精确覆盖问题的十字链表 + 回溯，数独 / 铺砖类模型。',s:'精确覆盖 / 重复覆盖；数独变种',pr:'P4929 舞蹈链; P1784 数独'},
{id:'s_sim',p:'c_search',n:'模拟与实现',t:0},
{id:'sim',p:'s_sim',n:'大模拟',t:1,tg:4,d:'先设计数据结构与函数拆分再写；按题面顺序逐句实现；边写边测。',s:'题面很长、规则很多、没有算法',pr:'P1042 乒乓球; P3952 时间复杂度; P2482 猪国杀'},
{id:'exprparse',p:'s_sim',n:'表达式求值 / 递归下降',t:1,tg:3,d:'双栈或递归下降处理优先级、括号、一元运算；也用于解析题意中的语法。',s:'给字符串表达式；自定义语法',pr:'P1175 表达式的转换; P1981 表达式求值; P7073 表达式'},
{id:'baseconv',p:'s_sim',n:'进制 / 日期类模拟',t:1,tg:2,d:'进制转换、负进制、日期推算（闰年/星期），细节题的基础。',s:'k 进制表示；跨年月的日期计算',pr:'P1017 进制转换; P1143 进制转换; P5731 日期类模拟'},

{id:'c_cons',p:'b_base',n:'构造与交互',t:0},
{id:'g_cons',p:'c_cons',n:'构造基本功',t:0},
{id:'brute',p:'g_cons',n:'小数据打表 / 爆搜',t:1,tg:5,d:'5 分钟内写出 n ≤ 8 的爆搜，找规律、找反例。这是构造题最值钱的技能。',s:'任何构造题的第一步；验证猜结论',pr:'每道构造题都先写爆搜验证; 记录写爆搜用时'},
{id:'invariant',p:'g_cons',n:'不变量 / 奇偶性',t:1,tg:6,d:'和、异或和、逆序对奇偶、模数守恒——用来判无解。',s:'判断无解；操作不改变某个量',pr:'CF Div2 C/D 构造题; 每题问自己"操作不改变什么"'},
{id:'induct',p:'g_cons',n:'递归 / 归纳构造',t:2,tg:6,d:'n→n−1 或 n→n/2；先构造特殊解再调整。',s:'n 任意大；从小规模拼出大规模',pr:'CF Div2 D/E 构造; CF Div1 A/B 构造'},
{id:'perm',p:'g_cons',n:'置换环',t:2,tg:5,d:'排列拆环，交换次数 = n − 环数。',s:'交换 / 排列还原；最少操作次数',pr:'P1667 数列; CF 排列类构造题'},
{id:'binsplit',p:'g_cons',n:'二进制拆分 / 分治构造',t:2,tg:4,d:'按二进制位分组，log 次操作区分/覆盖所有对。',s:'只能操作 ≤20 次；要区分所有点对',pr:'交互题常见套路; CF 1900~2200 分治构造'},
{id:'s_cons2',p:'c_cons',n:'构造进阶',t:0},
{id:'extreme',p:'s_cons2',n:'极端原理与调整法',t:2,tg:4,d:'从最大/最小元素入手；先给一个合法解再局部调整到最优；证明"总能调整"。',s:'存在性构造；"是否总能"类题',pr:'CF 1500~1900 构造 (从极值入手); AtCoder ARC B/C 构造'},
{id:'gridcons',p:'s_cons2',n:'排列 / 网格构造',t:2,tg:4,d:'排列的特殊构造（相邻差、逆序对数、循环移位）；棋盘染色与对称填法。',s:'构造排列满足…；n×m 网格填数',pr:'CF 1400~1800 排列构造; AtCoder ARC 网格构造'},
{id:'graphcons',p:'s_cons2',n:'图构造',t:3,tg:3,d:'给定度序列 (Havel-Hakimi)、欧拉路径、竞赛图、树的直径/深度约束构造。',s:'构造一张图使得…；给定度数或路径条件',pr:'CF 1700~2100 图构造; AtCoder ARC 图构造'},
{id:'s_inter',p:'c_cons',n:'交互题',t:0},
{id:'inter',p:'s_inter',n:'交互题基础',t:2,tg:3,d:'二分/倍增式询问，控制次数，注意 flush。',s:'询问次数限制',pr:'CF 交互题 1600~2000; 自写交互器对拍'},
{id:'inter2',p:'inter',n:'交互进阶 / 信息论下界',t:3,tg:3,d:'用 log 的信息量估计询问下界；自适应交互器；随机化询问。',s:'询问次数恰好卡在 log 附近；自适应题',pr:'CF 交互题 2000~2400; 每题先估计下界'},

/* ================= Ⅱ 动态规划 ================= */
{id:'b_dp',p:'root',n:'Ⅱ 动态规划',t:0,dir:'d'},
{id:'c_dp1',p:'b_dp',n:'DP 基础模型',t:0},
{id:'s_linear',p:'c_dp1',n:'线性 DP',t:0},
{id:'lineardp',p:'s_linear',n:'线性 DP 建模',t:1,tg:6,d:'阶段 / 状态 / 决策三要素；状态要"无后效性"；先写暴力递推再压缩。',s:'序列上按位置递推；答案由前缀决定',pr:'P1216 数字三角形; P1091 合唱队形; P1541 乌龟棋'},
{id:'lis',p:'s_linear',n:'LIS / LCS',t:1,tg:5,d:'O(n log n) LIS（二分维护最小末尾）；LCS 与 LIS 的互转；Dilworth 定理。',s:'最长上升 / 公共子序列；最少几个不上升覆盖',pr:'P1020 导弹拦截; P1439 最长公共子序列; P2782 友好城市'},
{id:'edit',p:'s_linear',n:'编辑距离 / 序列对齐',t:1,tg:3,d:'二维 dp[i][j] 表示两串前缀；插入/删除/替换转移。',s:'两个序列对齐；最少修改次数',pr:'P2758 编辑距离; P1279 字串距离; AtCoder EDU DP F'},
{id:'dpcount',p:'s_linear',n:'计数 DP 与方案还原',t:1,tg:4,d:'把"最优"换成"方案数"，注意不重不漏；记录决策点回溯输出方案。',s:'求方案数（取模）；输出一种最优方案',pr:'P1002 过河卒; P1044 栈; AtCoder EDU DP H'},
{id:'s_knap',p:'c_dp1',n:'背包',t:0},
{id:'knap01',p:'s_knap',n:'01 / 完全 / 多重背包',t:1,tg:6,d:'滚动数组与循环方向；多重背包二进制拆分。',s:'选物品受容量限制；每件可选多次',pr:'P1048 采药; P1616 疯狂的采药; P1776 宝物筛选'},
{id:'knapopt',p:'knap01',n:'多重背包单调队列优化',t:2,tg:3,d:'按余数分组，每组内是滑动窗口最大值，O(nV)。',s:'物品数量大且 V 大；二进制拆分仍超时',pr:'P1776 宝物筛选; P1833 樱花'},
{id:'groupknap',p:'s_knap',n:'分组 / 依赖背包',t:2,tg:4,d:'每组至多选一；依赖关系转成树上背包（金明的预算方案）。',s:'互斥选择；选 B 必须先选 A',pr:'P1757 通天之分组背包; P1064 金明的预算方案; P2014 选课'},
{id:'knapcount',p:'s_knap',n:'背包计数 / 退背包',t:2,tg:4,d:'方案数背包；"去掉一个物品"用逆向撤销 O(V)。',s:'恰好装满的方案数；每个物品被删掉后的答案',pr:'P1164 小A点菜; P4141 消失之物; P2340 奶牛展览'},
{id:'mixedknap',p:'s_knap',n:'泛化背包 / 带限制背包',t:3,tg:3,d:'物品是函数（凸函数可闵可夫斯基合并）；负权 / 双维限制转维度。',s:'价值随数量非线性；两个约束维度',pr:'P5322 排兵布阵; P2340 奶牛展览; CF 背包 1900+'},
{id:'s_interval',p:'c_dp1',n:'区间 DP',t:0},
{id:'interval',p:'s_interval',n:'区间 DP 基础',t:1,tg:5,d:'dp[l][r] 由分割点 k 合并；环形问题倍长；按区间长度枚举。',s:'合并相邻两段的代价；括号 / 消除类',pr:'P1880 石子合并; P1063 能量项链; P4170 涂色'},
{id:'interval2',p:'interval',n:'区间 DP 进阶',t:2,tg:4,d:'状态带额外维度（当前位置/方向）、区间消除与折叠、区间上的计数。',s:'区间两端扩展；消除后两侧拼接',pr:'P1220 关路灯; P2466 Sue的小球; P4302 字符串折叠'},

{id:'c_dp2',p:'b_dp',n:'DP 进阶模型',t:0},
{id:'s_treedp',p:'c_dp2',n:'树形 DP',t:0},
{id:'treedp',p:'s_treedp',n:'树形 DP 基础',t:1,tg:5,d:'dfs 后序合并子树；状态包含"选/不选当前点"；覆盖/独立集模型。',s:'树上选点满足相邻约束；子树内统计',pr:'P1352 没有上司的舞会; P2016 战略游戏; P1122 最大子树和'},
{id:'reroot',p:'treedp',n:'换根 DP',t:2,tg:4,d:'两遍 dfs：先算子树内，再由父亲推出"子树外"的贡献。',s:'以每个点为根的答案；到所有点的距离和',pr:'P3478 STA-Station; P2986 Great Cow Gathering; CF1187E'},
{id:'treeknap',p:'treedp',n:'树上背包',t:2,tg:4,d:'子树大小作容量，合并时上下界限制保证总复杂度 O(n²)。',s:'树上选 k 个点 / 保留 k 条边',pr:'P2014 选课; P1273 有线电视网; P2015 二叉苹果树'},
{id:'treedpcount',p:'s_treedp',n:'树上计数与路径统计',t:2,tg:4,d:'路径在 LCA 处合并两侧；统计经过每条边的路径数；直径类 DP。',s:'所有路径的和 / 条数；最长路径',pr:'P3177 树上染色; P4827 Crash 的文明世界; CF 树上路径统计'},
{id:'s_bitmask',p:'c_dp2',n:'状压 DP',t:0},
{id:'bitmask',p:'s_bitmask',n:'状压 DP 基础',t:1,tg:5,d:'集合 / 行状态压成整数；预处理合法状态；旅行商模型。',s:'n ≤ 20；棋盘每行状态；访问集合',pr:'P1896 互不侵犯; P1879 玉米田; P1433 吃奶酪; P2704 炮兵阵地'},
{id:'sos',p:'bitmask',n:'高维前缀和 (SOS DP)',t:2,tg:3,d:'对每一位做前缀和，O(n·2^n) 求所有子集/超集的和。',s:'枚举子集 3^n 超时；统计子集数量',pr:'CF165E Compatible Numbers; CF449D Jzzhu and Numbers; ARC100E Or Plus Max'},
{id:'subsetconv',p:'sos',n:'子集卷积（了解）',t:4,tg:2,d:'按 popcount 分层后做或卷积，O(n²·2^n)。',s:'两个不相交子集合并的计数',pr:'P6097 子集卷积'},
{id:'plugdp',p:'bitmask',n:'插头 DP（了解）',t:4,tg:2,d:'轮廓线上记录插头状态，用哈希表滚动；回路 / 路径覆盖计数。',s:'网格上的回路 / 铺砖计数，n,m ≤ 12',pr:'P5056 插头 DP; HDU1693 Eat the Trees'},
{id:'s_digit',p:'c_dp2',n:'数位 DP',t:0},
{id:'digitdp',p:'s_digit',n:'数位 DP 基础',t:2,tg:5,d:'记忆化 dfs(pos, state, limit, lead)；答案用前缀相减。',s:'[L,R] 内满足数位条件的数的个数',pr:'P2657 windy 数; P2602 数字计数; P4127 同类分布'},
{id:'digitdp2',p:'digitdp',n:'数位 DP 进阶',t:3,tg:3,d:'多重约束、回文/字符串条件、二进制数位、与其他 DP 结合。',s:'数位条件复杂或有多个；按位异或计数',pr:'P4124 手机号码; P3413 萌数; P4999 烦人的数学作业'},
{id:'s_probdp',p:'c_dp2',n:'概率与期望 DP',t:0},
{id:'expdp',p:'s_probdp',n:'期望 DP',t:2,tg:5,d:'逆推（从终态到初态）；期望线性性拆贡献；"期望 = 概率 × 值"求和。',s:'随机过程的期望步数 / 得分',pr:'P4550 收集邮票; P1850 换教室; P1654 OSU!'},
{id:'expdp2',p:'expdp',n:'带环期望 / 高斯消元',t:3,tg:3,d:'转移有环时列方程组高斯消元；树上可以用待定系数消环。',s:'随机游走可能回到之前状态',pr:'P3232 游走; P4321 随机漫游; P2473 奖励关'},
{id:'gamedp',p:'s_probdp',n:'双人博弈 DP',t:2,tg:3,d:'状态是"轮到谁 + 局面"，min-max 转移；区间上的取数博弈。',s:'两人轮流取，双方最优',pr:'P2734 游戏 A Game; P4363 一双木棋; AtCoder EDU DP L'},
{id:'s_strdp',p:'c_dp2',n:'字符串上的 DP',t:0},
{id:'stringdp',p:'s_strdp',n:'子序列 / 子串计数 DP',t:2,tg:4,d:'子序列自动机（nxt 数组）；不同子序列计数去重；回文子序列。',s:'本质不同子序列数；子串匹配计数',pr:'P2679 子串; P1435 回文字串; AtCoder EDU DP'},

{id:'c_dpopt',p:'b_dp',n:'DP 优化',t:0},
{id:'s_opt1',p:'c_dpopt',n:'常用优化',t:0},
{id:'dsopt',p:'s_opt1',n:'数据结构优化 DP',t:2,tg:5,d:'转移是区间最值/求和时用 BIT / 线段树维护 dp 值；按值域建树。',s:'转移形如 max{dp[j]} (j 在某个范围)',pr:'P1020 导弹拦截; P3287 方伯伯的玉米田; P2605 基站选址'},
{id:'monoqueue',p:'s_opt1',n:'单调队列优化',t:2,tg:4,d:'转移窗口 [i−k, i) 上取最值，用单调队列 O(1) 均摊。',s:'决策范围是滑动窗口',pr:'P1725 琪露诺; P3572 Little Bird; P1776 宝物筛选'},
{id:'matexp',p:'s_opt1',n:'矩阵快速幂优化 DP',t:2,tg:4,d:'线性递推 / 图上走 k 步的方案数写成矩阵；广义矩阵乘法 (max,+)。',s:'转移固定且 n 巨大 (1e18)',pr:'P1939 矩阵加速; P4159 迷路; P2151 HH 去散步'},
{id:'dpstate',p:'s_opt1',n:'状态设计技巧',t:2,tg:4,d:'换维（把值当维度）、等价类合并、滚动/离散化状态、费用提前计算。',s:'直觉状态数爆炸；某个维度可以互换',pr:'P2340 奶牛展览; P2051 中国象棋; P4158 粉刷匠'},
{id:'s_opt2',p:'c_dpopt',n:'凸优化类',t:0},
{id:'slope',p:'s_opt2',n:'斜率优化',t:3,tg:5,d:'转移写成 y = kx + b 形式，维护凸壳；单调时用队列，否则二分 / CDQ / 李超树。',s:'转移含 i·j 交叉项',pr:'P3195 玩具装箱; P2365 任务安排; P5785 任务安排 (加强); P4072 征途'},
{id:'dq',p:'s_opt2',n:'决策单调性 / 分治优化',t:3,tg:4,d:'最优决策点单调时分治求解 O(n log n)，或二分队列。',s:'四边形不等式成立；代价函数是凸的',pr:'P3515 Lightning Conductor; P4767 邮局; P1912 诗人小 G'},
{id:'quad',p:'dq',n:'四边形不等式',t:3,tg:3,d:'区间 DP 的 opt[l][r−1] ≤ opt[l][r] ≤ opt[l+1][r]，O(n²)。',s:'区间合并 DP 且代价满足 w(a,d)+w(b,c) ≥ w(a,c)+w(b,d)',pr:'P1880 石子合并; P4767 邮局; P5574 任务分配'},
{id:'wqs',p:'s_opt2',n:'WQS 二分 / 凸优化',t:3,tg:4,d:'"恰好选 k 个"且答案关于 k 凸时，二分惩罚项去掉限制。',s:'恰好 k 个的最优值；答案关于 k 是凸的',pr:'P2619 Tree I; P4383 林克卡特树; P5633 最小度限制生成树'},
{id:'s_opt3',p:'c_dpopt',n:'高级优化',t:0},
{id:'cdqdp',p:'s_opt3',n:'CDQ 分治优化 DP',t:3,tg:3,d:'转移依赖二维偏序时按时间分治，左半贡献右半。',s:'转移条件是 a_j<a_i 且 b_j<b_i',pr:'P2487 拦截导弹; P4093 序列'},
{id:'dpmerge',p:'s_opt3',n:'线段树合并 / 长链剖分优化（了解）',t:4,tg:2,d:'树形 DP 的子树信息用可合并结构维护，O(n log n) 或 O(n)。',s:'树形 DP 状态是"深度"或"值域"',pr:'P5290 春节十二响; P4556 雨天的尾巴; P3899 谈笑风生'},
{id:'ddp',p:'s_opt3',n:'动态 DP（了解）',t:4,tg:2,d:'树剖 + 矩阵，支持修改点权后重算树形 DP。',s:'树形 DP + 单点修改 + 多次询问',pr:'P4719 动态 DP; P4751 动态 DP (加强)'},

/* ================= Ⅲ 图论与数据结构 ================= */
{id:'b_gds',p:'root',n:'Ⅲ 图论与数据结构',t:0,dir:'g'},
{id:'c_ds1',p:'b_gds',n:'基础数据结构',t:0},
{id:'g_basic',p:'c_ds1',n:'基础工具',t:0},
{id:'bit',p:'g_basic',n:'树状数组',t:1,tg:6,d:'单点改区间查、区间改单点查、逆序对。',s:'动态前缀统计；逆序对；离线数点',pr:'P3374; P3368; P1908 逆序对'},
{id:'bit2',p:'bit',n:'BIT 区间改区间查 / 二维 BIT',t:2,tg:3,d:'两个 BIT 维护 d_i 与 i·d_i；二维前缀+差分。',s:'区间加区间和但不想写线段树；矩阵单点改矩形查',pr:'P3372 用 BIT 做; P4514 上帝造题的七分钟'},
{id:'bitbs',p:'bit',n:'BIT 上倍增二分',t:2,tg:3,d:'O(log n) 找第 k 小 / 第一个前缀和 ≥ k 的位置。',s:'权值 BIT 第 k 小；动态排名',pr:'P1168 中位数; P3369 用 BIT 做'},
{id:'dsu',p:'g_basic',n:'并查集',t:1,tg:5,d:'路径压缩+按秩；连通块合并；离线倒序加边。',s:'动态加边连通性；只有删除→倒过来做',pr:'P3367; P1197 星球大战; P1955 程序自动分析'},
{id:'wdsu',p:'dsu',n:'带权并查集 / 扩展域',t:2,tg:4,d:'维护到根的距离/奇偶；扩展域处理敌我/种类关系。',s:'食物链；奇偶约束；"a 和 b 的关系是…"',pr:'P2024 食物链; P1196 银河英雄传说; P1525 关押罪犯'},
{id:'undodsu',p:'dsu',n:'可撤销并查集',t:2,tg:3,d:'按秩合并不压缩，用栈撤销到任意历史状态。',s:'需要回退状态；配合分治',pr:'P5787 线段树分治前置; 自写模板对拍'},
{id:'segdiv',p:'undodsu',n:'线段树分治',t:3,tg:3,d:'每条边存在于时间区间→挂到线段树上，DFS 时加边，回溯时撤销。',s:'离线；边有存活时间；动态二分图判定',pr:'P5787 二分图; P5227 [AHOI2013] 连通图'},
{id:'st',p:'g_basic',n:'ST 表',t:1,tg:3,d:'静态区间"可重复贡献"查询 O(1)。',s:'静态 RMQ；区间 gcd 或 / 与',pr:'P3865; P1890 gcd 区间'},
{id:'heap',p:'g_basic',n:'堆技巧（对顶堆 / 懒删除）',t:1,tg:5,d:'动态中位数；标记删除；配合贪心做"可反悔"。',s:'动态中位数；选 k 个后可反悔；任务调度',pr:'P1168 中位数; P2949 工作调度; P4053 建筑抢修'},
{id:'g_seg',p:'c_ds1',n:'线段树家族',t:0},
{id:'seg1',p:'g_seg',n:'基础线段树（懒标记）',t:1,tg:6,d:'区间加/乘/赋值 + 区间和/最值，标记的组合顺序。',s:'区间修改 + 区间查询',pr:'P3372; P3373; P1253 扶苏的问题'},
{id:'seginfo',p:'seg1',n:'信息合并线段树',t:2,tg:6,d:'节点存结构体，写 merge() 拼左右信息。给你新信息你能自己写 merge/pushdown 才算过关。',s:'答案可由左右两半拼出：最大子段和 / 连续 1 / 矩阵',pr:'P4513 小白逛公园; P2572 序列操作; P2894 Hotel'},
{id:'segbs',p:'seg1',n:'线段树上二分',t:2,tg:5,d:'在树上直接找第一个满足条件的位置，不要套外层二分。',s:'第一个 ≥k 的位置；第 k 个 1；从 1 最远能延伸到哪',pr:'P4344 脑洞治疗仪; P2824 排序'},
{id:'segdyn',p:'seg1',n:'动态开点线段树',t:2,tg:4,d:'值域 1e9 不方便离散化；需要很多棵树。',s:'值域大；多棵线段树',pr:'P3369 用动态开点; P3960 列队'},
{id:'segval',p:'segdyn',n:'权值线段树',t:2,tg:4,d:'下标=值，维护第 k 小/排名/前驱后继。',s:'需要平衡树操作但不需要区间翻转',pr:'P3369 普通平衡树; P1801 黑匣子'},
{id:'pst',p:'segval',n:'主席树（可持久化权值线段树）',t:2,tg:5,d:'前缀版本相减做区间第 k 小、区间内 ≤x 的个数。',s:'静态区间第 k 小；区间不同数 (在线)；历史版本查询',pr:'P3834; P3919 可持久化数组; P1972 在线做法'},
{id:'treepst',p:'pst',n:'树上主席树',t:3,tg:3,d:'每点继承父亲版本，路径查询用 u+v−lca−fa(lca)。',s:'树上路径第 k 小',pr:'P2633 Count on a tree'},
{id:'segmerge',p:'segdyn',n:'线段树合并 / 分裂',t:3,tg:4,d:'总合并复杂度 O(n log n)；子树信息合并上传。',s:'子树内统计需保留完整结构；树上差分 + 合并',pr:'P4556 雨天的尾巴; P3224 永无乡; P5494 线段树分裂'},
{id:'scan',p:'seg1',n:'扫描线',t:2,tg:5,d:'区间→端点事件，沿另一维扫描，线段树维护覆盖情况。',s:'矩形面积/周长并；被 ≥k 个矩形覆盖；二维区间问题',pr:'P5490 面积并; P1856 矩形周长; P1502 窗口的星星'},
{id:'segpot',p:'seg1',n:'势能线段树',t:2,tg:3,d:'区间开方/取模/与——每个数被有效修改次数有限，直接暴力递归到叶。',s:'区间开方 / 区间取模 / 区间与或',pr:'P4145 花神游历各国; CF438D The Child and Sequence'},
{id:'segbeats',p:'seg1',n:'吉司机线段树 (Segment Tree Beats)',t:3,tg:3,d:'维护最大值、次大值、最大值个数处理区间 chmin。',s:'区间取 min/max + 区间和；历史最值',pr:'P6242 线段树 3'},
{id:'lichao',p:'seg1',n:'李超线段树',t:3,tg:3,d:'维护一次函数集合，单点查最值。',s:'动态插入直线/线段，查某 x 处最值；斜率优化的替代',pr:'P4097 [HEOI2013] Segment; P4254 Blue Mary 开公司'},
{id:'seggraph',p:'seg1',n:'线段树优化建图',t:3,tg:3,d:'入树/出树，点向区间连边只需 O(log) 条。',s:'点向区间连边；区间向点连边；边数 O(n²) 爆炸',pr:'P6348 [PA2011] Journeys; CF786B Legacy'},
{id:'s_bal',p:'c_ds1',n:'平衡树与可并堆',t:0},
{id:'treap',p:'s_bal',n:'FHQ Treap',t:3,tg:4,d:'分裂合并实现区间翻转、插入删除。',s:'区间翻转 / 插入 / 删除；序列操作',pr:'P3369; P3391 文艺平衡树'},
{id:'splay',p:'treap',n:'Splay（了解）',t:4,tg:2,d:'伸展操作，LCT 的基础；一般用 FHQ 代替。',s:'需要 LCT；区间操作',pr:'P3391 用 Splay 写一遍'},
{id:'leftist',p:'s_bal',n:'左偏树 / 可并堆',t:3,tg:3,d:'O(log n) 合并两个堆；配合并查集找堆顶。',s:'多个堆需要合并；树上子树合并取最值',pr:'P3377 左偏树; P1456 Monkey King; P2713 罗马游戏'},

{id:'c_ds2',p:'b_gds',n:'离线与高级结构',t:0},
{id:'g_off',p:'c_ds2',n:'离线与分治',t:0},
{id:'offbit',p:'g_off',n:'离线排序 + BIT（二维数点）',t:1,tg:6,d:'把一维排序消掉，另一维用 BIT 维护。这是你"识别不出 DS"最该练的一项。',s:'询问互相独立且有两个维度限制；有多少对 (i,j) 满足…',pr:'P1972 HH 的项链; P2163 园丁的烦恼; P1637 三元上升子序列'},
{id:'cdq',p:'offbit',n:'CDQ 分治',t:3,tg:4,d:'按时间分治，统计左半修改对右半询问的贡献。',s:'三维偏序；带修二维数点；不想写树套树',pr:'P3810 三维偏序; P4390 Mokia'},
{id:'wholebs',p:'offbit',n:'整体二分',t:3,tg:3,d:'所有询问一起二分答案，按贡献划分到两侧。',s:'多组第 k 小；答案单调可判定',pr:'P3527 Meteors; P3834 用整体二分'},
{id:'timerev',p:'g_off',n:'时间倒流',t:1,tg:3,d:'删除操作倒序变成加入操作。',s:'只有删边/删点；询问连通性',pr:'P1197 星球大战; P6121 Closing the Farm'},
{id:'mo',p:'g_off',n:'莫队',t:2,tg:5,d:'离线按块排序询问，O(n√n) 移动指针，奇偶优化。',s:'区间统计不可合并但可增删；n≤1e5 且离线',pr:'P1494 小 Z 的袜子; P2709 小 B 的询问'},
{id:'mo2',p:'mo',n:'带修莫队 / 回滚莫队',t:3,tg:3,d:'加时间维 O(n^{5/3})；只增不删的回滚。',s:'带单点修改的区间统计；只能加不能删 (区间众数)',pr:'P1903 数颜色; P5906 回滚莫队'},
{id:'block',p:'g_off',n:'分块',t:2,tg:4,d:'整块打标记散块暴力；根号平衡修改/查询。',s:'操作难以用线段树合并；区间内 ≤x 的个数',pr:'P2801 教主的魔法; P4135 作诗; P3372 分块做'},
{id:'sqrtdiv',p:'g_off',n:'根号分治',t:2,tg:4,d:'按大小分两类：大类数量少直接枚举，小类预处理。',s:'Σ大小 = n；询问参数与"大小"有关；按度数分类',pr:'CF1207F Remainder Problem; P3396 哈希冲突'},
{id:'bitset',p:'g_off',n:'bitset 优化',t:2,tg:3,d:'/64 常数，传递闭包、可达性、布尔背包。',s:'n≤1e4 的 O(n²)/O(n³)；可达性；布尔背包',pr:'P4306 连通数; P3674 小清新人渣的本愿'},
{id:'g_adv',p:'c_ds2',n:'高级数据结构',t:0},
{id:'lbasis',p:'g_adv',n:'线性基',t:2,tg:4,d:'异或空间的基，最大异或和、第 k 小、区间线性基。',s:'异或最大 / 第 k 大；子集异或；树上路径异或',pr:'P3812; P4570 元素; P4151 最大 XOR 和路径'},
{id:'perdsu',p:'g_adv',n:'可持久化数组 / 并查集',t:3,tg:3,d:'主席树当数组，并查集按秩合并不压缩。',s:'回到历史版本；版本分叉',pr:'P3919; P3402'},
{id:'treetree',p:'g_adv',n:'树套树（了解）',t:4,tg:2,d:'BIT 套动态开点线段树，在线带修二维数点。',s:'带修区间第 k 小 (在线)',pr:'P3380 二逼平衡树'},
{id:'lct',p:'g_adv',n:'LCT（了解）',t:4,tg:2,d:'动态树维护链信息，区域赛几乎不会强制。',s:'动态加删边 + 路径查询',pr:'P3690 LCT 模板'},
{id:'kdtree',p:'g_adv',n:'K-D Tree（了解）',t:4,tg:2,d:'多维空间划分，矩形查询/最近点期望 O(√n)。',s:'二维平面点集的矩形统计且强制在线',pr:'P4148 简单题; P4169 天使玩偶'},

{id:'c_graph1',p:'b_gds',n:'图论基础',t:0},
{id:'g_graph',p:'c_graph1',n:'遍历与基本结构',t:0},
{id:'bfs',p:'g_graph',n:'BFS / DFS / 0-1 BFS',t:1,tg:5,d:'多源 BFS、双端队列 0-1 BFS、隐式图状态搜索。',s:'网格图；边权只有 0/1；状态空间搜索',pr:'P4667 Switch the Lamp On; P1443 马的遍历; P1135 奇怪的电梯'},
{id:'topo',p:'g_graph',n:'拓扑排序 / DAG DP',t:1,tg:6,d:'DAG 最长路、路径计数、字典序最小拓扑序（优先队列）。',s:'依赖关系；先后顺序；有向无环',pr:'P1113 杂务; P4017 最大食物链计数; P3243 菜肴制作'},
{id:'euler',p:'g_graph',n:'欧拉路 / 欧拉回路',t:2,tg:4,d:'Hierholzer 算法；度数条件；有向/无向。',s:'一笔画；每条边恰好一次；最少笔画',pr:'P7771 欧拉路径; P1341 无序字母对; P2731 骑马修栅栏'},
{id:'pseudo',p:'g_graph',n:'基环树',t:2,tg:5,d:'找环，断环成树，环上 DP + 树 DP。',s:'n 点 n 边；每点恰一条出边',pr:'P2607 骑士; P4381 Island; P1453 城市环路'},
{id:'s_sp',p:'c_graph1',n:'最短路',t:0},
{id:'dij',p:'s_sp',n:'Dijkstra 及变形',t:1,tg:8,d:'分层图、反图、超级源点、把"状态"当点、记录方案。',s:'最短 + 少量额外状态（免费 k 次）；多起点/终点；次短路',pr:'P4779; P4568 飞行路线; P1144 最短路计数; P2865 Roadblocks'},
{id:'spg',p:'dij',n:'最短路图 / 最短路 DAG',t:2,tg:4,d:'保留 dis[u]+w=dis[v] 的边构成 DAG，再 DP / 计数 / 割点。',s:'最短路条数；必经边；"最短路上再问一个问题"',pr:'P1144; P2149 Elaxia 的路线; P3106 Dueling GPS'},
{id:'modsp',p:'dij',n:'同余最短路',t:2,tg:3,d:'以最小物品为模数建环，跳转求每个余数的最小可达值。',s:'几种物品能凑出哪些数；值域大但物品种类少',pr:'P3403 跳楼机; P2371 墨墨的等式'},
{id:'kth',p:'dij',n:'次短路 / K 短路（了解）',t:2,tg:3,d:'次短路同时松弛两个值；K 短路 A* 或可持久化堆。',s:'第二短；前 k 短',pr:'P2865; P2483 k 短路'},
{id:'spfa',p:'s_sp',n:'Bellman-Ford / 差分约束',t:1,tg:5,d:'负环判定；约束 x_i−x_j≤c 建边跑最短/最长路。',s:'不等式组；求最小/最大可行解；负权边',pr:'P3385 负环; P5960 差分约束; P1993 小 K 的农场'},
{id:'floyd',p:'s_sp',n:'Floyd / 传递闭包 / 最小环',t:1,tg:4,d:'k 维的含义；只经过编号 ≤k 的中间点；n≤400 全源。',s:'可达性；无向图最小环；多重限制',pr:'P2910 Clear And Present Danger; P6175 无向图的最小环; P2419 Cow Contest'},
{id:'s_mst',p:'c_graph1',n:'生成树',t:0},
{id:'mst',p:'s_mst',n:'最小生成树',t:1,tg:5,d:'Kruskal / Prim；瓶颈路性质。',s:'连通代价最小；路径最大边权最小',pr:'P3366; P1991 无线通讯网; P2330 繁忙的都市'},
{id:'smst',p:'mst',n:'次小生成树',t:2,tg:3,d:'非树边替换树上路径的最大/严格次大边。',s:'严格次小；判断某边是否可能在 MST 中',pr:'P4180 严格次小生成树'},
{id:'krt',p:'mst',n:'Kruskal 重构树',t:2,tg:5,d:'按边权顺序加虚点建二叉树，子树 = 只走边权 ≤x 可达的集合。',s:'只走边权 ≤x 的边能到哪 (在线)；路径最大边权最小值多组询问',pr:'P4768 归程; P1967 货车运输; P4197 Peaks'},
{id:'dmst',p:'s_mst',n:'最小树形图 / Borůvka（了解）',t:4,tg:2,d:'有向图的生成树用朱刘算法；Borůvka 适合"边权由点权函数决定"的完全图 MST。',s:'有向生成树；完全图 MST 且边权是 xor/距离',pr:'P4716 最小树形图; CF888G Xor-MST'},
{id:'g_conn',p:'c_graph1',n:'连通性',t:0},
{id:'scc',p:'g_conn',n:'Tarjan SCC 缩点',t:1,tg:6,d:'缩点成 DAG 再 DP。',s:'互相可达；出发能到的最大权；最少加边使强连通',pr:'P3387 缩点; P2341 受欢迎的牛; P2746 校园网'},
{id:'twosat',p:'scc',n:'2-SAT',t:2,tg:5,d:'变量二选一，建蕴含图，Tarjan 判可行并输出方案（拓扑序反向）。',s:'每个东西二选一 + 若干"不能同时"；命题逻辑约束',pr:'P4782; P4171 满汉全席; P3825 游戏'},
{id:'cut',p:'g_conn',n:'割点 / 割边',t:1,tg:4,d:'low 数组；割边注意重边处理。',s:'删掉哪个点/边后不连通',pr:'P3388 割点; P1656 炸铁路'},
{id:'ebcc',p:'cut',n:'边双缩点',t:2,tg:5,d:'缩边双后是一棵树，问题转为树上问题。',s:'任意删一条边仍连通；最少加几条边使边双连通',pr:'P8436 边双; P2860 Redundant Paths; P2783 有机化学之神'},
{id:'vbcc',p:'cut',n:'点双 / 圆方树',t:3,tg:4,d:'方点代表点双，路径上经过的方点的邻居即"可能经过的点"。',s:'必经点；删点后仍连通；两点路径可经过哪些点',pr:'P8435 点双; P4630 [APIO2018] 铁人两项; P4606 战略游戏'},
{id:'dom',p:'g_conn',n:'支配树（了解）',t:4,tg:2,d:'DAG 上用 LCA 求支配；一般图 Lengauer-Tarjan。',s:'从 s 到 t 必经的点；删点后哪些点不可达',pr:'P5180 支配树; P2597 灾难'},

{id:'c_graph2',p:'b_gds',n:'图论进阶',t:0},
{id:'g_flow',p:'c_graph2',n:'匹配与网络流',t:0},
{id:'bip',p:'g_flow',n:'二分图判定 + 匈牙利 / HK',t:1,tg:5,d:'染色判定；增广路求最大匹配。',s:'两类物体配对；行与列；棋盘放置',pr:'P1330 封锁阳光大学; P3386 最大匹配; P1129 矩阵游戏'},
{id:'bipmodel',p:'bip',n:'二分图建模（König / 最小路径覆盖）',t:2,tg:6,d:'最小点覆盖=最大匹配；最大独立集=n−匹配；DAG 最小路径覆盖=n−匹配。',s:'选最少点覆盖所有边；最多互不冲突；最少条链覆盖 DAG',pr:'P2764 最小路径覆盖; P3355 骑士共存; P2825 游戏'},
{id:'hall',p:'bip',n:'Hall 定理 / 一般图匹配（了解）',t:4,tg:2,d:'完美匹配存在性判定；带花树。',s:'判断是否存在完美匹配而不求出；非二分图配对',pr:'CF981F Round Marriage; P6113 一般图最大匹配'},
{id:'km',p:'bip',n:'KM 算法 / 最大权匹配',t:3,tg:3,d:'二分图最大权完美匹配，O(n³) 的 BFS 版；也可用费用流代替。',s:'配对且权和最大，n ≤ 500',pr:'P6577 二分图最大权完美匹配; P1559 运动员最佳匹配问题'},
{id:'dinic',p:'bipmodel',n:'Dinic 最大流',t:2,tg:4,d:'当前弧优化；多重匹配；拆点处理点容量。',s:'容量/流量；有容量→拆点；多重匹配',pr:'P3376; P2763 试题库; P1231 教辅的组成'},
{id:'mincut',p:'dinic',n:'最小割建模',t:3,tg:5,d:'最大流=最小割；选/不选划分；最大权闭合子图。',s:'两组物品选或不选且有交叉代价；收益依赖；割开源汇',pr:'P2057 善意的投票; P2762 太空飞行计划; P4174 最大获利'},
{id:'flowmodel',p:'mincut',n:'网络流建模专题',t:3,tg:4,d:'最小割二分（同类相邻代价）、区间 k 覆盖、最大权闭合、平面图最小割转最短路。',s:'网格上相邻元素有代价；选 k 条不相交区间',pr:'P1361 小 M 的作物; P2774 方格取数; P3358 最长 k 可重区间集; P4001 狼抓兔子'},
{id:'mcmf',p:'dinic',n:'费用流',t:3,tg:4,d:'SPFA / Dijkstra(势能) 增广最短路。',s:'带权配对；区间 k 覆盖；运输问题',pr:'P3381; P4016 负载平衡; P3358 最长 k 可重区间集'},
{id:'bound',p:'dinic',n:'上下界网络流（了解）',t:4,tg:2,d:'补流建虚拟源汇。',s:'边有流量下界',pr:'P5192 有源汇上下界最大流'},
{id:'g_tree',p:'c_graph2',n:'树上问题',t:0},
{id:'dfsord',p:'g_tree',n:'DFS 序 + 线段树 / BIT',t:1,tg:6,d:'子树 = DFS 序上的连续区间。',s:'子树加 / 子树查；子树内满足…的数量',pr:'P3178 树上操作; P4092 树; P3374 变形'},
{id:'lca',p:'g_tree',n:'LCA（倍增 / 树剖 / 欧拉序）',t:1,tg:5,d:'三种写法至少熟练两种。',s:'树上两点距离；所有路径问题的前置',pr:'P3379; P4281 紧急集合; P3398 仓鼠找 sugar'},
{id:'diam',p:'g_tree',n:'直径与重心',t:1,tg:4,d:'两遍 BFS / 树 DP 求直径；离任意点最远的是直径端点；重心使最大子树最小。',s:'树上最远点；所有点到某点距离和最小',pr:'P5536 核心城市; P1099 树网的核; P1364 医院设置'},
{id:'treediff',p:'lca',n:'树上差分',t:1,tg:4,d:'路径加转成四个点的差分，dfs 回溯时子树求和；点差分与边差分。',s:'多条路径覆盖后统计每点/每边；离线路径加',pr:'P3128 Max Flow; P3258 松鼠的新家; P2680 运输计划'},
{id:'hld',p:'lca',n:'树链剖分',t:2,tg:5,d:'重链剖分把路径拆成 O(log) 段区间，配合线段树做路径修改/查询。',s:'路径加 / 路径求和；子树 + 路径混合操作',pr:'P3384 树链剖分; P2146 软件包管理器; P3178 树上操作'},
{id:'dsuontree',p:'g_tree',n:'dsu on tree（启发式合并）',t:2,tg:4,d:'保留重儿子信息，轻儿子暴力重算，O(n log n)。',s:'每个子树内出现最多的颜色 / 不同颜色数；子树统计且无修改',pr:'CF600E Lomsat gelral; CF570D Tree Requests; U41492 树上数颜色'},
{id:'cdec',p:'g_tree',n:'点分治',t:2,tg:5,d:'重心分治，统计经过重心的路径。',s:'树上路径长度为 k 的对数；距离 ≤k 的点对；所有路径统计',pr:'P3806 点分治; P4178 Tree; P4149 Race'},
{id:'cdtree',p:'cdec',n:'点分树（动态点分治）',t:3,tg:3,d:'分治结构建成树，每层维护信息支持修改。',s:'带修改的树上距离统计',pr:'P6329 震波; P3241 开店'},
{id:'vtree',p:'g_tree',n:'虚树',t:3,tg:4,d:'关键点 + LCA 建小树，边权压缩。',s:'多组询问每组 k 个关键点，Σk 有限',pr:'P2495 消耗战; P4103 大工程; P3233 世界树'},
{id:'longchain',p:'g_tree',n:'长链剖分',t:3,tg:3,d:'与深度相关的 DP O(n)；k 级祖先 O(1)。',s:'dp[u][深度]；树上 k 级祖先',pr:'P5903 树上 k 级祖先; CF1009F Dominant Indices'},
{id:'prufer',p:'g_tree',n:'Prüfer 序列 / 树计数',t:3,tg:3,d:'度数序列 → 树的数量 (n−2)!/Π(d_i−1)!。',s:'有多少棵树满足度数；有标号树计数',pr:'P6086 Prüfer 序列; P2290 Count'},
{id:'treehash',p:'g_tree',n:'树哈希（了解）',t:3,tg:2,d:'子树同构判定。',s:'判同构；子树去重',pr:'P5043 树同构'},
{id:'s_special',p:'c_graph2',n:'特殊图',t:0},
{id:'tournament',p:'s_special',n:'竞赛图与图论性质',t:3,tg:3,d:'竞赛图必有哈密顿路、缩点后是链（Landau 定理）；图论经典结论库。',s:'任意两点间恰有一条有向边；判断得分序列合法',pr:'CF 1900~2300 竞赛图; AtCoder ARC 图性质'},
{id:'planar',p:'s_special',n:'平面图与对偶图（了解）',t:4,tg:2,d:'平面图最小割转对偶图最短路；欧拉公式 V−E+F=2。',s:'网格 / 平面图上的最小割',pr:'P4001 狼抓兔子; P2046 海拔'},
{id:'cactus',p:'s_special',n:'仙人掌（了解）',t:4,tg:2,d:'每条边至多在一个环上，圆方树后按树处理。',s:'"每条边最多属于一个简单环"',pr:'P5236 静态仙人掌; P4244 仙人掌'},

/* ================= Ⅳ 数学 · 博弈 · 几何 ================= */
{id:'b_math',p:'root',n:'Ⅳ 数学 · 博弈 · 几何',t:0,dir:'m'},
{id:'c_nt',p:'b_math',n:'数论',t:0},
{id:'s_nt1',p:'c_nt',n:'数论基础',t:0},
{id:'gcd',p:'s_nt1',n:'欧几里得 / 扩展欧几里得',t:1,tg:4,d:'gcd 性质、裴蜀定理、exgcd 解 ax+by=c 与线性同余方程。',s:'求整数解；模逆元 (模数非质数)',pr:'P1082 同余方程; P5656 二元一次不定方程; P1029 最大公约数和最小公倍数'},
{id:'sieve',p:'s_nt1',n:'筛法（埃氏 / 线性）',t:1,tg:4,d:'线性筛同时筛出最小质因子、欧拉函数、莫比乌斯函数等积性函数。',s:'1e7 内所有质数 / 因子信息',pr:'P3383 线性筛素数; P1865 A % B Problem; P2158 仪仗队'},
{id:'qpow',p:'s_nt1',n:'快速幂 / 逆元',t:1,tg:4,d:'费马小定理逆元、线性递推逆元、阶乘逆元预处理。',s:'模意义下除法；组合数预处理',pr:'P1226 快速幂; P3811 乘法逆元; P5431 乘法逆元 2'},
{id:'eulerthm',p:'s_nt1',n:'欧拉定理 / 扩展欧拉定理',t:2,tg:3,d:'a^b ≡ a^(b mod φ(m) + φ(m))；处理指数塔。',s:'指数巨大 / 指数是幂塔',pr:'P5091 扩展欧拉定理; P4139 上帝与集合的正确用法'},
{id:'lucas',p:'s_nt1',n:'Lucas / exLucas',t:2,tg:3,d:'模质数的大组合数；模合数分解后 CRT 合并。',s:'C(n,m) mod p，n 巨大而 p 小',pr:'P3807 卢卡斯定理; P2480 古代猪文; P4720 扩展卢卡斯'},
{id:'crt',p:'s_nt1',n:'中国剩余定理 / exCRT',t:2,tg:3,d:'合并同余方程组；模数不互质时用 exgcd 两两合并。',s:'x ≡ a_i (mod m_i) 求 x',pr:'P1495 曹冲养猪; P4777 扩展中国剩余定理; P3868 猜数字'},
{id:'s_nt2',p:'c_nt',n:'数论进阶',t:0},
{id:'bsgs',p:'s_nt2',n:'BSGS / 离散对数',t:3,tg:3,d:'a^x ≡ b (mod p) 分块打表 O(√p)；扩展 BSGS 处理不互质。',s:'求指数 x；模意义下的对数',pr:'P3846 BSGS; P4195 exBSGS; P2485 计算器'},
{id:'primetest',p:'s_nt2',n:'Miller-Rabin / Pollard-Rho',t:3,tg:3,d:'1e18 内素性测试与分解，配合 __int128。',s:'大数判素 / 分解质因数',pr:'P4718 Pollard-Rho; SP4941 Prime or Not'},
{id:'primitive',p:'s_nt2',n:'原根与阶',t:3,tg:2,d:'原根存在性、求法；阶的性质用于周期问题。',s:'模 p 乘法群生成元；循环节',pr:'P6091 原根; CF 数论 2100+'},
{id:'quadres',p:'s_nt2',n:'二次剩余（了解）',t:4,tg:1,d:'Cipolla 求模质数平方根。',s:'x² ≡ n (mod p)',pr:'P5491 二次剩余'},
{id:'s_mult',p:'c_nt',n:'积性函数与反演',t:0},
{id:'multfunc',p:'s_mult',n:'积性函数与欧拉函数',t:2,tg:4,d:'φ、μ、d、σ 的性质与线性筛；Σ_{d|n} φ(d) = n 等恒等式。',s:'Σ gcd；与 n 互质的数的和；约数个数和',pr:'P2158 仪仗队; P2568 GCD; P2303 Longge 的问题'},
{id:'blockdiv',p:'s_mult',n:'整除分块',t:2,tg:3,d:'⌊n/i⌋ 只有 O(√n) 种取值；二维分块取两者的 min。',s:'Σ ⌊n/i⌋ · f(i)',pr:'P2261 余数求和; P3935 Calculating; P2260 模积和'},
{id:'mobius',p:'blockdiv',n:'莫比乌斯反演',t:3,tg:5,d:'[gcd=1] = Σ μ(d)；套路化推式子后整除分块。',s:'Σ_i Σ_j f(gcd(i,j))；gcd 恰好为 k 的对数',pr:'P3455 ZAP-Queries; P2522 Problem b; P3327 约数个数和; P1829 Crash 的数字表格'},
{id:'dirichlet',p:'mobius',n:'狄利克雷卷积与前缀和',t:3,tg:3,d:'f*g 的卷积视角推恒等式；狄利克雷前缀和 O(n log log n)。',s:'Σ_{d|n} 形式的变换；约数的高维前缀和',pr:'P5495 Dirichlet 前缀和; P4449 于神之怒加强版'},
{id:'du',p:'dirichlet',n:'杜教筛（了解）',t:4,tg:2,d:'构造 g 使 f*g 好求，O(n^{2/3}) 求积性函数前缀和。',s:'n ≤ 1e10 的 Σμ / Σφ',pr:'P4213 杜教筛; P3768 简单的数学题'},
{id:'min25',p:'dirichlet',n:'Min_25 筛（了解）',t:4,tg:1,d:'一般积性函数前缀和，O(n^{3/4}/log n)。',s:'质数处是多项式的积性函数前缀和',pr:'P5325 Min_25 筛'},
{id:'polyfloor',p:'s_mult',n:'类欧几里得（了解）',t:4,tg:1,d:'Σ ⌊(ai+b)/c⌋ 的递归求和。',s:'直线下整点计数',pr:'P5170 类欧几里得算法'},

{id:'c_comb',p:'b_math',n:'组合计数',t:0},
{id:'s_comb1',p:'c_comb',n:'计数基础',t:0},
{id:'binom',p:'s_comb1',n:'组合数与基本计数',t:1,tg:5,d:'阶乘逆元预处理、杨辉三角、隔板法、圆排列、多重集排列。',s:'方案数取模；可重 / 不可重选择',pr:'P2822 组合数问题; P1313 计算系数; P1866 编号'},
{id:'inclexcl',p:'s_comb1',n:'容斥原理',t:2,tg:5,d:'至少/恰好互转；子集容斥 2^k；错排；有上界的隔板法。',s:'"至少一个"、"都不满足"；每种物品数量有上限',pr:'P5505 分特产; P1450 硬币购物; P3197 越狱; P2567 幸运数字'},
{id:'special',p:'s_comb1',n:'卡特兰 / 斯特林 / 贝尔数',t:2,tg:4,d:'经典数列的组合意义与递推；卡特兰的折线反射证明。',s:'合法括号序列；n 个元素分成 k 个非空集合',pr:'P1044 栈; P1655 小朋友的球; P3200 有趣的数列'},
{id:'pigeon',p:'s_comb1',n:'抽屉原理与极值论证',t:1,tg:3,d:'存在性证明工具；前缀和模 n 必有相等；配合构造题。',s:'"一定存在" 类结论；n+1 个数模 n',pr:'CF618F Double Knapsack; CF1270B; 构造题中的存在性'},
{id:'s_comb2',p:'c_comb',n:'计数进阶',t:0},
{id:'binominv',p:'s_comb2',n:'二项式反演',t:3,tg:4,d:'"钦定 k 个" g(k) 与 "恰好 k 个" f(k) 互转。',s:'恰好 k 个满足…；钦定容易恰好难',pr:'P4859 已经没有什么好害怕的了; P4491 染色; P5505 分特产'},
{id:'stirling',p:'s_comb2',n:'斯特林数与斯特林反演',t:3,tg:3,d:'普通幂 ↔ 下降幂转换；Σ i^k 用第二类斯特林数拆开。',s:'Σ C(n,i)·i^k；幂次求和转下降幂',pr:'P5395 第二类斯特林数·行; P5408 第一类斯特林数·行; P6620 组合数问题'},
{id:'burnside',p:'s_comb2',n:'Burnside / Pólya',t:3,tg:4,d:'旋转/翻转等价类计数 = 平均不动点数；循环节 gcd(n,k)。',s:'项链 / 环染色，旋转视为相同',pr:'P4980 Pólya 定理; P1446 Cards; P4727 图的同构计数'},
{id:'genfunc',p:'s_comb2',n:'生成函数入门',t:3,tg:4,d:'OGF 表达组合选择，EGF 表达有标号排列；封闭形式与系数提取。',s:'多种物品各有数量限制的方案数；有标号计数',pr:'P2000 拯救世界; P4389 付公主的背包; P4841 城市规划'},
{id:'lgv',p:'s_comb2',n:'LGV 引理（了解）',t:4,tg:2,d:'不相交路径组计数 = 路径数矩阵行列式。',s:'DAG 上 k 条互不相交路径的方案数',pr:'P6657 LGV 引理; P7736 路径交叉'},
{id:'minmaxincl',p:'s_comb2',n:'min-max 容斥（了解）',t:4,tg:2,d:'E[max S] = Σ (−1)^{|T|+1} E[min T]，配合期望求全收集时间。',s:'收集全部的期望时间；kth max',pr:'P3175 按位或; P4707 重返现世'},

{id:'c_la',p:'b_math',n:'线性代数与多项式',t:0},
{id:'s_la',p:'c_la',n:'线性代数',t:0},
{id:'matrix',p:'s_la',n:'矩阵乘法与快速幂',t:1,tg:4,d:'线性递推写成矩阵；注意乘法顺序与 O(k³ log n) 常数。',s:'第 n 项，n 达 1e18；固定转移',pr:'P3390 矩阵快速幂; P1962 斐波那契数列; P2233 公交车路线'},
{id:'gauss',p:'s_la',n:'高斯消元',t:2,tg:4,d:'实数 / 模意义 / 异或方程组；判无解与多解；求逆矩阵。',s:'n ≤ 500 的线性方程组；期望有环；异或约束',pr:'P3389 高斯消元; P2447 外星千足虫; P4035 球形空间产生器'},
{id:'det',p:'gauss',n:'行列式 / 矩阵树定理',t:3,tg:3,d:'辗转相除求模意义行列式；生成树计数 = 基尔霍夫矩阵任一余子式。',s:'生成树个数；有向生成树计数',pr:'P7112 行列式求值; P6178 矩阵树定理; P4336 黑暗前的幻想乡'},
{id:'s_poly',p:'c_la',n:'多项式',t:0},
{id:'fft',p:'s_poly',n:'FFT / NTT',t:3,tg:4,d:'卷积加速；蝴蝶变换；任意模数三模 NTT 了解即可。',s:'Σ a_i b_{k−i}；大整数乘法；计数题中的卷积',pr:'P3803 多项式乘法; P1919 A*B Problem 升级版; P3338 力'},
{id:'fwt',p:'fft',n:'FWT / 位运算卷积',t:3,tg:3,d:'或/与/异或卷积 O(n·2^n)。',s:'c_k = Σ_{i xor j = k} a_i b_j',pr:'P4717 快速沃尔什变换; CF662C Binary Table'},
{id:'lagrange',p:'s_poly',n:'拉格朗日插值',t:3,tg:3,d:'n+1 个点还原 n 次多项式；连续整点 O(n) 求值。',s:'答案关于 n 是多项式；Σ i^k',pr:'P4781 拉格朗日插值; P4593 教科书般的亵渎; CF622F'},
{id:'polyinv',p:'fft',n:'多项式求逆 / ln / exp（了解）',t:4,tg:2,d:'牛顿迭代倍增；用于生成函数封闭形式的展开。',s:'生成函数 1/F(x)、exp(F(x))',pr:'P4238 多项式乘法逆; P4725 多项式对数; P4726 多项式指数'},
{id:'polyfull',p:'polyinv',n:'多项式全家桶（了解）',t:4,tg:1,d:'分治 FFT、多点求值、快速插值等，区域赛极少要求。',s:'多项式的复杂操作',pr:'P4721 分治 FFT; P5050 多点求值'},
{id:'blm',p:'s_poly',n:'BM 线性递推（了解）',t:4,tg:2,d:'Berlekamp-Massey 从前几项猜最短线性递推，配合暴力打表出奇迹。',s:'打表发现是线性递推但推不出式子',pr:'P5487 线性递推; P4723 常系数齐次线性递推'},

{id:'c_probgame',p:'b_math',n:'概率与博弈',t:0},
{id:'s_prob',p:'c_probgame',n:'概率与期望',t:0},
{id:'linexp',p:'s_prob',n:'期望线性性',t:1,tg:4,d:'把总期望拆成每个元素/每对元素的贡献，无需独立性。',s:'随机排列 / 随机子集的某个量的期望',pr:'P1365 WJMZBMR 打 osu!; P3802 小魔女帕琪; P6835 概率充电器'},
{id:'condprob',p:'s_prob',n:'条件概率与全期望公式',t:2,tg:4,d:'按第一步分类；贝叶斯；概率 DP 与期望 DP 的边界。',s:'"在…条件下的概率"；多阶段随机过程',pr:'P2473 奖励关; P1291 百事世界杯之旅; P4284 概率充电器'},
{id:'martingale',p:'s_prob',n:'鞅与停时（了解）',t:4,tg:1,d:'构造势函数使每步期望变化为常数，直接得到期望停止时间。',s:'随机操作直到全部相同的期望步数',pr:'CF1349D Slime and Biscuits; CF1479E'},
{id:'s_game',p:'c_probgame',n:'博弈论',t:0},
{id:'nim',p:'s_game',n:'Nim / 巴什 / 威佐夫',t:1,tg:4,d:'异或和为 0 必败；取 k 上限的 mod (k+1)；威佐夫黄金分割。',s:'两人轮流取石子，取完者胜',pr:'P2197 nim 游戏; P4018 Roy&October 之取石子; P2252 取石子游戏'},
{id:'sg',p:'nim',n:'SG 函数',t:2,tg:5,d:'mex 递推；多个独立游戏的 SG 异或；打表找 SG 周期。',s:'可拆成多个独立子游戏；规则奇怪的取子',pr:'P2148 E&D; P2575 高手过招; P3185 分裂游戏; P2599 取石子'},
{id:'gamemisc',p:'sg',n:'博弈进阶',t:3,tg:3,d:'反 Nim、阶梯 Nim、树上删边 (Green Hackenbush)、每次改变多堆的变形。',s:'取到最后者输；只能移动到相邻堆；删边游戏',pr:'P4279 A-B Game; P3480 KAM-Pebbles; CF 博弈 2000+'},

{id:'c_geo',p:'b_math',n:'计算几何',t:0},
{id:'s_geo1',p:'c_geo',n:'几何基础',t:0},
{id:'vec',p:'s_geo1',n:'向量 / 叉积 / 点积',t:1,tg:4,d:'叉积判方向与面积；点积判夹角与投影；尽量用整数避免精度。',s:'点在直线哪一侧；三点共线；多边形有向面积',pr:'P1355 神秘大三角; P1652 圆; CF 1000~1400 几何判定'},
{id:'geoeps',p:'vec',n:'精度与整数化',t:1,tg:2,d:'能整数就整数；eps 比较；long double；避免除法与三角函数。',s:'所有几何题的前置检查',pr:'P1652 圆 (整数判定); 每题先问能否全整数'},
{id:'segint',p:'vec',n:'线段相交 / 点与多边形',t:2,tg:3,d:'跨立实验；射线法判点在多边形内；共线特判。',s:'两线段是否相交；点是否在多边形内',pr:'P1355; POJ1127 Jack Straws; P2313 汤姆的游戏'},
{id:'polyarea',p:'s_geo1',n:'多边形面积 / 皮克定理',t:2,tg:3,d:'鞋带公式；格点多边形 S = I + B/2 − 1。',s:'多边形面积；内部格点数',pr:'P1183 多边形的面积; P2735 电网; P2181 对角线'},
{id:'closest',p:'s_geo1',n:'最近点对 / 分治',t:2,tg:3,d:'按 x 分治，中间带按 y 排序只查常数个。',s:'平面 n 个点中距离最近的两个',pr:'P1429 平面最近点对; P7883 平面最近点对 (加强加强版); P1257'},
{id:'s_geo2',p:'c_geo',n:'凸包与进阶',t:0},
{id:'convex',p:'s_geo2',n:'凸包',t:2,tg:4,d:'Andrew 单调链；共线点处理；凸包周长/面积。',s:'包住所有点的最短围栏；极值点集合',pr:'P2742 二维凸包; P3829 信用卡凸包; P2116 城墙'},
{id:'rotcal',p:'convex',n:'旋转卡壳',t:3,tg:3,d:'凸包上对踵点对，求直径、最小矩形覆盖、最大三角形。',s:'凸包直径；最小外接矩形',pr:'P1452 旋转卡壳; P3187 最小矩形覆盖; P4166 最大土地面积'},
{id:'halfplane',p:'convex',n:'半平面交',t:3,tg:3,d:'排序增量法维护双端队列；多边形核；线性规划可行域。',s:'多边形核；所有半平面的公共区域面积',pr:'P4196 半平面交; P3256 多边形; P2600 瞭望塔'},
{id:'circle',p:'s_geo2',n:'圆相关',t:3,tg:3,d:'圆与直线/圆的交点、最小圆覆盖 (随机增量)、圆的面积并。',s:'最小圆覆盖；圆与多边形面积交',pr:'P1742 最小圆覆盖; P4207 月下柠檬树; P2510 圆的面积并'},
{id:'simpson',p:'s_geo2',n:'自适应辛普森',t:3,tg:2,d:'数值积分求不规则面积；注意 eps 与分段。',s:'曲线围成的面积；难以解析的积分',pr:'P4525 自适应辛普森法 1; P4526 自适应辛普森法 2'},
{id:'minkowski',p:'convex',n:'闵可夫斯基和（了解）',t:4,tg:1,d:'两凸包边按极角归并；判断两凸包位移后是否相交。',s:'A+B 的凸包；凸包"加法"',pr:'P4557 战争; CF87E'},
{id:'geo3d',p:'s_geo2',n:'三维几何（了解）',t:4,tg:1,d:'三维叉积、点面距离、三维凸包增量法。',s:'空间中的点/面/凸包',pr:'P4724 三维凸包'},

/* ================= Ⅴ 字符串与杂项 ================= */
{id:'b_str',p:'root',n:'Ⅴ 字符串与杂项',t:0},
{id:'c_str',p:'b_str',n:'字符串',t:0,dir:'d'},
{id:'s_str1',p:'c_str',n:'匹配基础',t:0},
{id:'hash',p:'s_str1',n:'字符串哈希',t:1,tg:5,d:'双模 / 自然溢出 + 随机底数；前缀哈希 O(1) 取子串；哈希 + 二分求 LCP。',s:'判断子串相等；找重复子串；回文判定',pr:'P3370 字符串哈希; P4503 企鹅 QQ; P2852 Milk Patterns (哈希+二分)'},
{id:'kmp',p:'s_str1',n:'KMP / border / 周期',t:1,tg:5,d:'next 数组即 border；最小周期 = n − border；失配树。',s:'单模式串匹配；循环节；前后缀相同',pr:'P3375 KMP; P4391 Radio Transmission; P3435 OKR-Periods of Words'},
{id:'z',p:'kmp',n:'Z 函数 / exKMP',t:2,tg:3,d:'z[i] = s 与 s[i..] 的 LCP；与前缀相关的匹配。',s:'每个后缀与整串的最长公共前缀',pr:'P5410 扩展 KMP; CF126B Password; P7114 字符串匹配'},
{id:'manacher',p:'s_str1',n:'Manacher',t:2,tg:3,d:'O(n) 求以每个位置为中心的最长回文半径。',s:'最长回文子串；回文中心相关统计',pr:'P3805 manacher; P4555 最长双回文串; P1659 拉拉队排练'},
{id:'trie',p:'s_str1',n:'Trie / 01-Trie',t:1,tg:5,d:'字典树前缀统计；01-Trie 贪心求最大异或；可持久化 01-Trie。',s:'公共前缀计数；最大异或对；区间最大异或',pr:'P8306 字典树; P4551 最长异或路径; P4735 最大异或和'},
{id:'minrep',p:'s_str1',n:'最小表示法',t:2,tg:2,d:'双指针 O(n) 求循环同构最小串。',s:'环形字符串判同构',pr:'P1368 最小表示法; POJ1509 Glass Beads'},
{id:'s_str2',p:'c_str',n:'自动机',t:0},
{id:'ac',p:'s_str2',n:'AC 自动机',t:2,tg:5,d:'Trie + fail 指针多模式匹配；fail 树上子树求和统计出现次数。',s:'多个模式串同时匹配；每个模式出现次数',pr:'P3808 AC 自动机 (简单版); P3796 AC 自动机 (加强版); P5357 AC 自动机 (二次加强版)'},
{id:'acdp',p:'ac',n:'AC 自动机上 DP',t:3,tg:4,d:'状态 = (长度, 自动机节点)，不经过终止节点的字符串计数。',s:'不含任何模式串的字符串数；包含至少一个',pr:'P4052 文本生成器; P3041 Video Game Combos; P3311 数数'},
{id:'sam',p:'s_str2',n:'后缀自动机 SAM',t:3,tg:5,d:'parent 树 + endpos 等价类；本质不同子串数；出现次数。',s:'本质不同子串；第 k 小子串；子串出现次数',pr:'P3804 后缀自动机; P2408 不同子串个数; P3975 弦论'},
{id:'samapp',p:'sam',n:'SAM 应用',t:3,tg:4,d:'两串 LCS、parent 树上 LCA 求最长公共后缀、endpos 集合线段树合并。',s:'多串最长公共子串；所有后缀两两 LCP 之和',pr:'P3181 找相同字符; P4248 差异; SP1811 LCS'},
{id:'gsam',p:'sam',n:'广义 SAM（了解）',t:4,tg:2,d:'多串共建自动机，Trie 上 BFS 插入。',s:'多个串的公共子串统计',pr:'P6139 广义后缀自动机; P3346 诸神眷顾的幻想乡'},
{id:'pam',p:'s_str2',n:'回文自动机 PAM',t:3,tg:3,d:'两棵根 (奇/偶)，fail 指向最长回文后缀；本质不同回文串。',s:'回文子串计数；每个前缀的最长回文后缀',pr:'P5496 回文自动机; P4287 双倍回文; P4762 Virus synthesis'},
{id:'s_str3',p:'c_str',n:'后缀结构',t:0},
{id:'sa',p:'s_str3',n:'后缀数组 SA',t:3,tg:4,d:'倍增 + 基数排序 O(n log n)；height 数组与 LCP 的 RMQ。',s:'后缀排序；字典序第 k 小后缀',pr:'P3809 后缀排序; P2870 Best Cow Line; P4051 字符加密'},
{id:'saapp',p:'sa',n:'SA 应用（height / LCP）',t:3,tg:4,d:'出现 k 次的最长子串二分 height；不同子串数；分组统计。',s:'重复 k 次的子串；LCP 相关统计',pr:'P2852 Milk Patterns; P2408 不同子串个数; P1117 优秀的拆分'},
{id:'lyndon',p:'s_str3',n:'Lyndon 分解 / Runs（了解）',t:4,tg:1,d:'Duval 算法 O(n)；周期结构理论。',s:'最小后缀；周期串结构',pr:'P6114 Lyndon 分解; P6656 Runs'},
{id:'suffixtree',p:'s_str3',n:'后缀树（了解）',t:4,tg:1,d:'反串 SAM 的 parent 树即后缀树；Ukkonen 在线构建。',s:'需要显式后缀树结构',pr:'用 SAM 反串构造一次'},

{id:'c_misc',p:'b_str',n:'杂项',t:0,dir:'a'},
{id:'s_misc1',p:'c_misc',n:'实用技巧',t:0},
{id:'bigint',p:'s_misc1',n:'高精度',t:1,tg:3,d:'压位加减乘、高精除低精、高精除高精；Python 兜底。',s:'数值超过 __int128',pr:'P1601 A+B Problem (高精); P1303 A*B Problem; P1480 A/B Problem'},
{id:'fastio',p:'s_misc1',n:'快读 / 卡常',t:1,tg:2,d:'fread 快读、减少取模、循环顺序与缓存、O2 与 inline；先保证正确再卡。',s:'输入量 1e7；复杂度对但 TLE',pr:'任何 1e7 级读入; P4390 用卡常过'},
{id:'debug',p:'s_misc1',n:'对拍与调试',t:1,tg:3,d:'随机数据生成 + 暴力 + 对拍脚本；边界 n=1 / 全相等 / 极值；assert。',s:'WA 但找不到反例；每场比赛必备',pr:'自写对拍脚本并复用; 每题列 3 个边界数据'},
{id:'heur',p:'s_misc1',n:'启发式合并',t:2,tg:3,d:'小的并到大的，每个元素被移动 O(log n) 次。',s:'合并两个集合并维护信息；set / map 合并',pr:'P3201 梦幻布丁; P3302 森林; P4197 Peaks'},
{id:'s_misc2',p:'c_misc',n:'随机化与启发式',t:0},
{id:'random',p:'s_misc2',n:'随机化',t:2,tg:4,d:'随机权值 xor 哈希判集合相等；随机采样找众数；期望复杂度分析；mt19937。',s:'出现次数 > n/2 的数；判断多重集相等；"任意一个满足"',pr:'CF364D Ghd; CF1418G Three Occurrences; P3396 哈希冲突'},
{id:'anneal',p:'s_misc2',n:'模拟退火 / 爬山',t:3,tg:3,d:'温度衰减、接受劣解概率；卡时多跑几次；只在没有正解时使用。',s:'连续优化 / 排列优化且无多项式算法',pr:'P1337 平衡点; P2503 均分数据; P3878 分金币'},
{id:'s_misc3',p:'c_misc',n:'思维与观察',t:0},
{id:'adhoc',p:'s_misc3',n:'Ad-hoc / 观察题',t:2,tg:6,d:'从小样例手玩、找性质、猜结论并用爆搜验证；分类讨论要写全。',s:'没有明显算法标签的 CF C/D；AtCoder ARC',pr:'CF Div2 C/D 思维题; AtCoder ARC A/B; 每题写下"关键观察"'},
{id:'tricks',p:'s_misc3',n:'经典套路库',t:2,tg:5,d:'时间倒流、贡献拆分、正难则反、枚举最值、二进制拆位、根号平衡；定期回顾自己的套路笔记。',s:'读题后 5 分钟能对上某个套路',pr:'整理本队套路笔记; CF 1600~2000 按 tag 刷'},
];

/* ================= 构建树 ================= */
const N={};RAW.forEach(r=>N[r.id]={...r,children:[]});
RAW.forEach(r=>{if(r.p)N[r.p].children.push(N[r.id]);});
const ROOT=N.root;
const LEAVES=RAW.filter(r=>r.t>0).map(r=>N[r.id]);
const BLOCKS=ROOT.children;
(function dfs(n,d,b){n.depth=d;n.block=b||(d===1?n:null);n.children.forEach(c=>dfs(c,d+1,n.block));})(ROOT,0,null);
function dirOf(n){let x=n;while(x){if(x.dir)return x.dir;x=x.p?N[x.p]:null;}return 'a';}
LEAVES.forEach(n=>n.dirv=dirOf(n));
const BLOCK_COLOR={b_base:'--b1',b_dp:'--b2',b_gds:'--b3',b_math:'--b4',b_str:'--b5'};
const cssv=v=>getComputedStyle(document.body).getPropertyValue(v).trim();
function bcolor(n){return n.block?cssv(BLOCK_COLOR[n.block.id]||'--acc'):cssv('--sub');}
const TIERN={1:'铜',2:'银',3:'金',4:'了解'};
const TIERS={1:'铜',2:'银',3:'金',4:'了'};
const DIRN={a:'通用',g:'图论 / DS',m:'数学',d:'DP / 字符串'};

/* ================= 状态（v2，自动迁移 v1） ================= */
const KEY='acm_skilltree_v2',OLDKEY='acm_skilltree_v1';
function defaultCollapsed(){const c={};RAW.forEach(r=>{const n=N[r.id];if(n.depth>=2&&n.children.length)c[n.id]=true;});return c;}
function defaultS(){return {ver:2,nodes:{},collapsed:defaultCollapsed(),sel:null};}
function load(){
  try{const v2=JSON.parse(localStorage.getItem(KEY));if(v2&&v2.nodes)return {ver:2,nodes:v2.nodes||{},collapsed:v2.collapsed||defaultCollapsed(),sel:v2.sel||null};}catch(e){}
  try{const v1=JSON.parse(localStorage.getItem(OLDKEY));if(v1&&v1.nodes){const s=defaultS();s.nodes=v1.nodes;s.migrated=true;return s;}}catch(e){}
  return defaultS();
}
let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function st(id){const n=N[id];if(!S.nodes[id])S.nodes[id]={level:0,target:n.tg,logs:[],note:''};const s=S.nodes[id];s.logs=s.logs||[];s.target=s.target||n.tg;if(s.note==null)s.note='';if(s.level==null)s.level=0;return s;}

/* ================= 巩固值 ================= */
function weight(l){let w=1;const r=+l.r;if(r)w=r>=2100?1.3:r>=1800?1:r>=1500?0.8:0.6;if(l.how==='sol')w*=0.6;return w;}
function calcAll(){
  LEAVES.forEach(n=>{
    const s=st(n.id);let wsum=0,last=null,indep=0;
    s.logs.forEach(l=>{wsum+=weight(l);if(!last||l.d>last)last=l.d;if(l.how!=='sol')indep++;});
    const target=+s.target||n.tg;
    const practice=Math.min(1,wsum/target);
    const base=practice*0.6+(s.level/3)*0.4;
    let ret=1,days=null;
    if(last){days=Math.max(0,Math.floor((Date.now()-new Date(last).getTime())/864e5));const half=14*(1+s.level)+3*s.logs.length;ret=Math.pow(0.5,days/half);}
    const eff=0.35+0.65*ret;
    n.calc={score:Math.round(100*base*eff),practice,wsum,target,ret,days,solved:s.logs.length,indep,base,last};
  });
  function grp(n){if(n.t>0){const a=[n.calc.score];n.children.forEach(c=>a.push(...grp(c)));n.calc.sub=a;return a;}let a=[];n.children.forEach(c=>a=a.concat(grp(c)));n.calc={score:a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0,cnt:a.length,mastered:a.filter(x=>x>=85).length};return a;}
  grp(ROOT);
  LEAVES.forEach(n=>{const p=N[n.p];n.locked=p.t>0&&p.calc.score<60;});
}
function status(n){if(n.locked)return '锁定';const s=n.calc.score;return s>=85?'已掌握':s>=50?'熟悉中':s>0?'刚起步':'未开始';}
function color(s){return `hsl(${Math.round(s*1.15)},42%,${document.body.classList.contains('dark')?'58%':'44%'})`;}

/* ================= 主题 ================= */
let THEME=(()=>{try{return localStorage.getItem('skilltree_theme')==='dark'?'dark':'light';}catch(e){return 'light';}})();
function applyTheme(){document.body.classList.toggle('dark',THEME==='dark');document.getElementById('themeBtn').textContent=THEME==='dark'?'日间':'夜间';}
applyTheme();
document.getElementById('themeBtn').onclick=()=>{THEME=THEME==='dark'?'light':'dark';try{localStorage.setItem('skilltree_theme',THEME);}catch(e){}applyTheme();render();};

/* ================= 布局 & 渲染 ================= */
const svg=document.getElementById('svg'),vp=document.getElementById('vp');
let T={x:40,y:30,k:1},maxTier=4,blockF='all',dirF='all',q='';
const ROW=44,GAP=64;
const H={0:44,1:44,2:38,3:34};
function tw(s){let w=0;for(const ch of s)w+=ch.charCodeAt(0)>255?12.5:7;return w;}
function nodeH(n){return n.t>0?36:(H[n.depth]||34);}
function nodeW(n){if(n.t>0)return Math.min(320,Math.max(150,tw(n.n)+78));if(n.depth===1)return Math.max(210,tw(n.n)+60);if(n.depth===2)return Math.max(160,tw(n.n)+56);return Math.max(150,tw(n.n)+50);}
function match(n){if(!q)return true;return (n.n+' '+(n.s||'')+' '+(n.d||'')).toLowerCase().includes(q);}
function hasMatch(n){if(n._hm!==undefined)return n._hm;let r=match(n)&&n.t>0;n.children.forEach(c=>{if(hasMatch(c))r=true;});return n._hm=r;}
function visible(n){
  if(n._vis!==undefined)return n._vis;
  let r;
  if(n.t>0){r=n.t<=maxTier&&(dirF==='all'||n.dirv===dirF||n.dirv==='a')&&(!q||hasMatch(n));}
  else if(n.id==='root')r=true;
  else if(n.depth===1&&blockF!=='all'&&n.id!==blockF)r=false;
  else r=n.children.some(visible);
  return n._vis=r;
}
function kids(n){if(S.collapsed[n.id]&&!q)return [];return n.children.filter(visible);}
function layout(){
  RAW.forEach(r=>{delete N[r.id]._hm;delete N[r.id]._vis;});
  const colW={};
  (function wd(n){n.w=nodeW(n);n.h=nodeH(n);colW[n.depth]=Math.max(colW[n.depth]||0,n.w);kids(n).forEach(wd);})(ROOT);
  const colX={};let x=0;for(let d=0;d<=8;d++){colX[d]=x;x+=(colW[d]||150)+GAP;}
  let y=40;
  (function dfs(n){
    const k=kids(n);
    if(!k.length){n.y=y;y+=ROW;}
    else{k.forEach(dfs);n.y=(k[0].y+k[k.length-1].y)/2;}
    if(n.depth<=2&&n.children.length)y+=8;
    n.x=colX[n.depth];
  })(ROOT);
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(){
  calcAll();layout();
  const dark=THEME==='dark';
  let html='';
  (function walk(n){
    const k=kids(n),w=n.w,h=n.h,bc=bcolor(n);
    k.forEach(c=>{const lc=c.depth===1?bcolor(c):bc;html+=`<path class="link" stroke="${lc}" stroke-opacity="${c.depth===1?.5:.38}" d="M${n.x+w},${n.y+h/2} C${n.x+w+GAP/2},${n.y+h/2} ${c.x-GAP/2},${c.y+c.h/2} ${c.x},${c.y+c.h/2}"/>`;walk(c);});
    const sel=S.sel===n.id?' sel':'';
    if(n.t>0){
      const sc=n.calc.score,tc=cssv('--t'+n.t),tbg=cssv('--t'+n.t+'bg');
      const cls='node leaf'+(n.locked?' locked':'')+sel+(q&&match(n)?' hit':'');
      html+=`<g class="${cls}" transform="translate(${n.x},${n.y})" data-id="${n.id}"><title>${esc(n.d||'')}</title>
        <rect class="leafcard" width="${w}" height="${h}" rx="8"/>
        <rect x="0" y="7" width="3" height="${h-14}" rx="1.5" fill="${bc}" opacity=".9"/>
        <text x="12" y="16">${n.locked?'🔒 ':''}${esc(n.n)}</text>
        <text x="${w-40}" y="16" text-anchor="end" font-size="10.5" style="fill:${dark?'#9a9891':'#8b877c'}">${sc}</text>
        <g class="tierpill"><rect x="${w-34}" y="6" width="26" height="15" rx="7.5" fill="${tbg}"/><text x="${w-21}" y="17" text-anchor="middle" style="fill:${tc}">${TIERS[n.t]}</text></g>
        <rect class="pb" x="12" y="${h-9}" width="${w-24}" height="3" rx="1.5"/><rect x="12" y="${h-9}" width="${(w-24)*sc/100}" height="3" rx="1.5" fill="${color(sc)}"/>`;
    }else if(n.depth===0){
      html+=`<g class="node${sel}" transform="translate(${n.x},${n.y})" data-id="${n.id}"><g class="blk"><rect width="${w}" height="${h}" rx="10" fill="${dark?'#e6e4de':'#2a2a2a'}"/><text x="14" y="27" style="fill:${dark?'#1a1c20':'#fff'}">${esc(n.n)}</text><text x="${w-14}" y="27" text-anchor="end" font-size="11" style="fill:${dark?'#1a1c20':'#fff'};opacity:.7;font-weight:400">${n.calc.score}</text></g>`;
    }else if(n.depth===1){
      html+=`<g class="node${sel}" transform="translate(${n.x},${n.y})" data-id="${n.id}"><g class="blk"><rect width="${w}" height="${h}" rx="10" fill="${bc}"/><text x="14" y="27" style="fill:${dark?'#1a1c20':'#fff'}">${esc(n.n)}</text><text x="${w-14}" y="27" text-anchor="end" font-size="11" style="fill:${dark?'#1a1c20':'#fff'};opacity:.7;font-weight:400">${n.calc.score}</text></g>`;
    }else if(n.depth===2){
      html+=`<g class="node${sel}" transform="translate(${n.x},${n.y})" data-id="${n.id}"><g class="cat"><rect width="${w}" height="${h}" rx="8" fill="${bc}" fill-opacity="${dark?.18:.12}" stroke="${bc}"/><text x="12" y="24" style="fill:${bc}">${esc(n.n)}</text><text x="${w-12}" y="24" text-anchor="end" font-size="11" style="fill:${bc};opacity:.85;font-weight:400">${n.calc.score}</text></g>`;
    }else{
      html+=`<g class="node${sel}" transform="translate(${n.x},${n.y})" data-id="${n.id}"><g class="sub"><rect width="${w}" height="${h}" rx="7" stroke="${bc}" stroke-opacity=".6"/><text x="12" y="22">${esc(n.n)}</text><text x="${w-12}" y="22" text-anchor="end" font-size="11" style="fill:${dark?'#9a9891':'#8b877c'}">${n.calc.score}</text></g>`;
    }
    if(n.children.filter(visible).length&&!q){const c=S.collapsed[n.id];html+=`<g class="tog" data-tog="${n.id}"><circle cx="${w}" cy="${h/2}" r="8.5" stroke="${bc}"/><text x="${w}" y="${h/2+3.5}" text-anchor="middle">${c?countLeaves(n):'−'}</text></g>`;}
    html+='</g>';
  })(ROOT);
  vp.innerHTML=html;applyT();renderLegend();renderLeft();renderRight();save();
}
function countLeaves(n){if(n.t>0&&!n.children.length)return 1;let c=n.t>0?1:0;n.children.forEach(k=>{if(visible(k))c+=countLeaves(k);});return c;}
function applyT(){vp.setAttribute('transform',`translate(${T.x},${T.y}) scale(${T.k})`);}
let fitted=false;
function fitView(){
  const r=svg.getBoundingClientRect();if(r.width<50||r.height<50)return;
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  (function walk(n){minX=Math.min(minX,n.x);maxX=Math.max(maxX,n.x+n.w);minY=Math.min(minY,n.y);maxY=Math.max(maxY,n.y+n.h);kids(n).forEach(walk);})(ROOT);
  const k=Math.max(0.15,Math.min(1.4,Math.min(r.width/(maxX-minX+80),r.height/(maxY-minY+60))));
  T={x:(r.width-(maxX+minX)*k)/2,y:(r.height-(maxY+minY)*k)/2,k};applyT();fitted=true;
}
function renderLegend(){
  document.getElementById('legend').innerHTML=BLOCKS.map(b=>`<span><i style="background:${bcolor(b)}"></i>${esc(b.n.replace(/^[ⅠⅡⅢⅣⅤ]\s*/,''))}</span>`).join('')+'<span style="border-left:1px solid var(--line);height:12px"></span>'+[1,2,3,4].map(t=>`<span class="tag t${t}">${TIERN[t]}</span>`).join('');
}

/* 交互 */
svg.addEventListener('click',e=>{const tg=e.target.closest('[data-tog]');if(tg){const id=tg.dataset.tog;S.collapsed[id]=!S.collapsed[id];render();return;}const g=e.target.closest('.node');if(g){S.sel=g.dataset.id;render();}});
svg.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY<0?1.1:1/1.1,r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;T.x=mx-(mx-T.x)*f;T.y=my-(my-T.y)*f;T.k*=f;applyT();},{passive:false});
let drag=null;svg.addEventListener('mousedown',e=>{if(e.target.closest('.node')||e.target.closest('.tog'))return;drag={x:e.clientX-T.x,y:e.clientY-T.y};});
window.addEventListener('mousemove',e=>{if(drag){T.x=e.clientX-drag.x;T.y=e.clientY-drag.y;applyT();}});window.addEventListener('mouseup',()=>drag=null);
document.getElementById('fit').onclick=fitView;
document.getElementById('tierSel').onchange=e=>{maxTier=+e.target.value;render();};
const blockSel=document.getElementById('blockSel');BLOCKS.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=b.n;blockSel.appendChild(o);});
blockSel.onchange=e=>{blockF=e.target.value;render();setTimeout(fitView,0);};
document.getElementById('dirSel').onchange=e=>{dirF=e.target.value;render();};
document.getElementById('search').oninput=e=>{q=e.target.value.trim().toLowerCase();render();};
document.getElementById('expandAll').onclick=()=>{S.collapsed={};render();setTimeout(fitView,0);};
document.getElementById('collapseAll').onclick=()=>{S.collapsed=defaultCollapsed();render();setTimeout(fitView,0);};
document.getElementById('exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='skilltree_'+new Date().toISOString().slice(0,10)+'.json';a.click();};
document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o||typeof o!=='object'||!o.nodes)throw 0;S={ver:2,nodes:o.nodes,collapsed:o.collapsed||defaultCollapsed(),sel:o.sel||null};render();toast('已导入');}catch(err){alert('文件格式错误');}};rd.readAsText(f);e.target.value='';};
document.getElementById('resetBtn').onclick=()=>{if(confirm('确定清空所有进度？建议先导出备份。')){S=defaultS();render();}};
let toastT=null;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200);}

/* ================= 练什么（智能抽取） ================= */
const PICK_KEY='acm_skilltree_picks',PICK_SCOPE_KEY='acm_skilltree_scope',PICK_CUR_KEY='acm_skilltree_current',PICK_NUMS=[3,4,5];
let pickMask=null,pickCount=4,pickList=[],pickScope=(()=>{try{return localStorage.getItem(PICK_SCOPE_KEY)==='frontier'?'frontier':'practiced';}catch(e){return 'practiced';}})();
function readPicks(){try{const a=JSON.parse(localStorage.getItem(PICK_KEY));return Array.isArray(a)?a:[];}catch(e){return [];}}
function writePicks(a){try{localStorage.setItem(PICK_KEY,JSON.stringify(a));}catch(e){}}
function focusTier(){
  for(const t of [1,2,3]){
    const ls=LEAVES.filter(n=>n.t===t);
    const avg=ls.length?ls.reduce((x,n)=>x+n.calc.score,0)/ls.length:0;
    if(ls.length&&avg<75)return t;
  }
  return 3;
}
function frontierTier(){
  for(const t of [1,2,3]){
    const ls=LEAVES.filter(n=>n.t===t);
    const avg=ls.length?ls.reduce((x,n)=>x+n.calc.score,0)/ls.length:0;
    if(ls.length&&avg<85)return t;
  }
  return 3;
}
function majorOf(n){let x=n;while(x&&x.depth!==2&&x.p)x=N[x.p];return x?x.id:'';}
function levelOf(n){const s=S.nodes[n.id];return s&&s.level?s.level:0;}
function pickPool(k){
  const base=LEAVES.filter(n=>!n.locked),cap=Math.min(maxTier,3),fr=frontierTier();
  const tOk=n=>n.t<=cap,dirOk=n=>dirF==='all'||n.dirv===dirF||n.dirv==='a',blkOk=n=>blockF==='all'||(n.block&&n.block.id===blockF),scopeOk=n=>pickScope==='practiced'?n.calc.base>0:(n.calc.base>0||n.t<=fr);
  let p=base.filter(n=>tOk(n)&&dirOk(n)&&blkOk(n)&&scopeOk(n));
  if(p.length<k)p=base.filter(n=>tOk(n)&&dirOk(n)&&scopeOk(n));
  if(p.length<k)p=base.filter(n=>tOk(n)&&scopeOk(n));
  if(p.length<k&&maxTier>=4)p=base.filter(scopeOk);
  return p;
}
function pickWeight(n,focus,hist){
  const c=n.calc;
  let w=0.25+1.2*(1-Math.min(1,c.score/85));
  if(c.solved===0)w+=0.5;
  if(c.solved>0&&c.ret<0.7)w+=1.1*(1-c.ret)*Math.min(1,(c.days||0)/30+0.3);
  w*=n.t===focus?1.6:n.t===focus+1?0.9:n.t<focus?0.5:n.t===4?0.15:0.55;
  if(hist.has(n.id))w*=0.12;
  return w>0?w:0;
}
function pickReasons(n,focus){
  const c=n.calc,r=[];
  if(c.solved===0)r.push(levelOf(n)>0?'待实战':'未开始');
  else if(c.ret<0.6&&c.days>=14)r.push('久未复习');
  else if(c.score<50)r.push('刚起步');
  else if(c.score<85)r.push('待巩固');
  else r.push('已掌握·复习');
  if(n.t===focus)r.push('主攻层');
  else if(n.t===focus+1)r.push('进阶挑战');
  return r;
}
function pickKnowledgePoints(k,exclude){
  calcAll();
  const focus=focusTier(),prev=readPicks(),hist=new Set(prev),ex=exclude instanceof Set?exclude:new Set(exclude||[]),out=[];
  let pool=pickPool(k);
  const poolN=pool.length;
  if(poolN-ex.size>=k)pool=pool.filter(n=>!ex.has(n.id));
  out.focus=focus;out.pool=poolN;
  if(!pool.length)return out;
  const cnt=Math.min(k,pool.length),remain=pool.slice(),discount={};
  while(out.length<cnt){
    let best=null,bestKey=-Infinity;
    remain.forEach(n=>{
      const w=pickWeight(n,focus,hist)*(discount[n.id]||1);
      if(!(w>0))return;
      const key=Math.pow(Math.random(),1/w);
      if(key>bestKey){bestKey=key;best=n;}
    });
    if(!best)best=remain[Math.floor(Math.random()*remain.length)];
    out.push(best);
    remain.splice(remain.indexOf(best),1);
    const bb=best.block?best.block.id:'',bm=majorOf(best);
    remain.forEach(n=>{
      let d=discount[n.id]||1;
      if(bb&&n.block&&n.block.id===bb)d*=0.35;
      if(bm&&majorOf(n)===bm)d*=0.25;
      discount[n.id]=d;
    });
  }
  writePicks(out.map(n=>n.id).concat(prev).slice(0,40));
  return out;
}
function closePickModal(){
  if(!pickMask)return;
  pickMask.remove();pickMask=null;
  window.removeEventListener('keydown',pickEsc);
}
function pickEsc(e){if(e.key==='Escape')closePickModal();}
function renderPickModal(){
  const box=pickMask&&pickMask.querySelector('.pick-box');
  if(!box)return;
  const cards=pickList.map(n=>{
    const rs=pickReasons(n,pickList.focus);
    return `<div class="pick-card" data-go="${n.id}">
      <div class="pick-head"><span class="tag t${n.t}">${TIERN[n.t]}</span><b>${esc(n.n)}</b><span class="pick-score" style="color:${color(n.calc.score)}">${n.calc.score}</span></div>
      <div class="pick-sub">${esc(pathOf(n))} · ${status(n)}</div>
      <div class="pick-chips">${rs.map(r=>`<span class="pick-chip">${r}</span>`).join('')}</div>
      <div class="pick-desc">${esc(n.d)}</div>
    </div>`;
  }).join('');
  const empty=pickScope==='practiced'?'还没有记录或自评过的知识点可抽：先记录几道题 / 给知识点自评，或切到「含新知识点」。':'当前筛选下暂无可抽取的知识点，请放宽筛选后重试。';
  const poolN=pickList.pool!=null?pickList.pool:pickList.length;
  const short=pickList.length&&pickList.length<pickCount;
  const small=!short&&poolN<pickCount*2;
  const scopeWord=pickScope==='practiced'?'练过或自评过的':'可抽的';
  const tail=pickScope==='practiced'?'想更多可切「含新知识点」或先多记录几题。':'可放宽筛选或先在树里多记录练习。';
  const shortNote=short
    ?`当前范围只有 ${poolN} 个${scopeWord}知识点，已全部展示；${tail}`
    :`当前范围只有 ${poolN} 个${scopeWord}知识点，换一批只能在这几个之间轮换；${tail}`;
  box.innerHTML=`<h3>🎲 今天练什么</h3>
    <p class="pick-tip">默认只抽有记录或自评过（掌握程度不为 0）的知识点：优先薄弱、久未复习；「含新知识点」会加入${TIERN[frontierTier()]}牌层未开始的。</p>
    <div class="pick-count"><span>抽取范围</span><button class="mini${pickScope==='practiced'?' pri':''}" data-scope="practiced">已练过/自评</button><button class="mini${pickScope==='frontier'?' pri':''}" data-scope="frontier">含新知识点</button></div>
    <div class="pick-count"><span>抽取数量</span>${PICK_NUMS.map(x=>`<button class="mini${x===pickCount?' pri':''}" data-cnt="${x}">${x}</button>`).join('')}</div>
    <div class="pick-list">${cards||`<p class="pick-empty">${empty}</p>`}</div>
    ${short||small?`<p class="pick-note">${shortNote}</p>`:''}
    <div class="pick-btns"><button class="pri" id="pickReroll">换一批</button><button id="pickClose">关闭</button></div>`;
  box.querySelector('#pickReroll').onclick=pickReroll;
  box.querySelector('#pickClose').onclick=closePickModal;
  box.querySelectorAll('[data-cnt]').forEach(b=>b.onclick=()=>{pickCount=+b.dataset.cnt;pickReroll();});
  box.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>setPickScope(b.dataset.scope));
  box.querySelectorAll('.pick-card').forEach(c=>c.onclick=()=>{const id=c.dataset.go;S.sel=id;expandTo(id);render();closePickModal();});
}
function readCurrent(){try{const o=JSON.parse(localStorage.getItem(PICK_CUR_KEY));return o&&Array.isArray(o.ids)&&o.ids.length?o:null;}catch(e){return null;}}
function writeCurrent(){try{localStorage.setItem(PICK_CUR_KEY,JSON.stringify({ids:pickList.map(n=>n.id),scope:pickScope,count:pickCount,at:Date.now()}));}catch(e){}}
function pickReroll(){pickList=pickKnowledgePoints(pickCount,pickList.length?new Set(pickList.map(n=>n.id)):null);writeCurrent();renderPickModal();}
function setPickScope(s){pickScope=s;try{localStorage.setItem(PICK_SCOPE_KEY,s);}catch(e){}pickReroll();}
function openPickModal(){
  if(pickMask)return;
  pickMask=document.createElement('div');pickMask.className='pick-mask';
  const box=document.createElement('div');box.className='pick-box';
  pickMask.appendChild(box);document.body.appendChild(pickMask);
  pickMask.onclick=e=>{if(e.target===pickMask)closePickModal();};
  window.addEventListener('keydown',pickEsc);
  const saved=readCurrent(),list=saved?saved.ids.map(id=>N[id]).filter(n=>n):[];
  if(list.length){
    calcAll();
    list.focus=focusTier();
    list.pool=pickPool(pickCount).length;
    pickList=list;
    if(saved.scope==='frontier'||saved.scope==='practiced')pickScope=saved.scope;
    if(PICK_NUMS.includes(saved.count))pickCount=saved.count;
    renderPickModal();
  } else pickReroll();
}
document.getElementById('pickBtn').onclick=openPickModal;

/* ================= 左侧总览 ================= */
function tier(t){const ls=LEAVES.filter(n=>n.t===t);const m=ls.filter(n=>n.calc.score>=85).length;return {n:ls.length,m,avg:ls.length?Math.round(ls.reduce((x,n)=>x+n.calc.score,0)/ls.length):0};}
function renderLeft(){
  const L=document.getElementById('left');
  const t1=tier(1),t2=tier(2),t3=tier(3),t4=tier(4);
  const total=LEAVES.reduce((x,n)=>x+n.calc.solved,0);
  const medal=(name,ok,cond)=>`<div class="medal"><div class="row"><b>${name}</b><span class="${ok?'ok':'no'}">${ok?'✓ 就绪':'✗ 未就绪'}</span></div><small style="color:var(--sub)">${cond}</small></div>`;
  const pool=LEAVES.filter(n=>dirF==='all'||n.dirv===dirF||n.dirv==='a');
  const rec=pool.filter(n=>!n.locked&&n.calc.score<85&&n.t<=Math.min(maxTier,3)).sort((a,b)=>a.t-b.t||a.calc.score-b.calc.score).slice(0,6);
  const rev=pool.filter(n=>n.calc.solved>0&&n.calc.ret<0.6).sort((a,b)=>a.calc.ret-b.calc.ret).slice(0,6);
  const tierRow=(t,o,label)=>`<div class="row"><span><span class="tag t${t}">${TIERN[t]}</span>${label}</span><span style="color:var(--sub)">${o.avg} · ${o.m}/${o.n}</span></div><div class="bar"><i style="width:${o.avg}%;background:var(--t${t})"></i></div>`;
  L.innerHTML=`
  <h3>总览</h3>
  <div class="stat"><div><b>${ROOT.calc.score}</b><span>总巩固值</span></div><div><b>${total}</b><span>已刷题数</span></div><div><b>${LEAVES.filter(n=>n.calc.score>=85).length}<small style="font-size:11px;color:var(--sub);font-weight:400">/${LEAVES.length}</small></b><span>已掌握</span></div></div>
  ${S.migrated?'<small style="color:var(--sub)">已从旧版 (v1) 迁移刷题记录。</small>':''}
  <h3>层级进度</h3>
  ${tierRow(1,t1,'基础层')}${tierRow(2,t2,'中档核心')}${tierRow(3,t3,'进阶')}${tierRow(4,t4,'了解即可')}
  <h3>奖牌就绪度（估算）</h3>
  ${medal('铜牌',t1.avg>=75,'铜层均值 ≥ 75')}
  ${medal('银牌',t1.avg>=85&&t2.avg>=70,'铜层 ≥ 85 且 银层 ≥ 70')}
  ${medal('金牌',t2.avg>=85&&t3.avg>=65,'银层 ≥ 85 且 金层 ≥ 65')}
  <h3>板块雷达</h3>${radar()}
  <div class="blocklist">${BLOCKS.map(b=>`<div class="row" data-go="${b.id}"><span><i class="dot" style="background:${bcolor(b)}"></i>${esc(b.n.replace(/^[ⅠⅡⅢⅣⅤ]\s*/,''))}</span><span style="color:var(--sub)">${b.calc.score} · ${b.calc.mastered}/${b.calc.cnt}</span></div>`).join('')}</div>
  <h3>建议下一步攻克</h3>
  ${rec.map(n=>`<div class="card" data-go="${n.id}"><span class="tag t${n.t}">${TIERN[n.t]}</span>${esc(n.n)}<br><small>${esc(N[n.p].n)} · 巩固值 ${n.calc.score} · ${n.calc.solved}/${n.calc.target} 题</small></div>`).join('')||'<small style="color:var(--sub)">当前层级都已掌握</small>'}
  <h3>需要复习</h3>
  ${rev.map(n=>`<div class="card" data-go="${n.id}"><span class="tag t${n.t}">${TIERN[n.t]}</span>${esc(n.n)}<br><small>${n.calc.days} 天未练 · 记忆保持 ${Math.round(n.calc.ret*100)}%</small></div>`).join('')||'<small style="color:var(--sub)">暂无</small>'}
  <h3>巩固值公式</h3>
  <small style="color:var(--sub)">基础 = 60%×练习量(加权题数/目标) + 40%×自评等级(L/3)<br>题目权重：≥2100→1.3，≥1800→1.0，≥1500→0.8，否则 0.6；看题解 ×0.6<br>保持率 = 0.5^(天数/半衰期)，半衰期 = 14×(1+L)+3×题数<br>巩固值 = 基础 × (0.35 + 0.65×保持率)</small>`;
  L.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{S.sel=el.dataset.go;expandTo(el.dataset.go);render();});
}
function expandTo(id){let n=N[id];while(n&&n.p){n=N[n.p];S.collapsed[n.id]=false;}}
function radar(){
  const R=78,cx=130,cy=98,g=BLOCKS,m=g.length,line=cssv('--line'),txt=cssv('--sub'),acc=cssv('--acc');
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/m;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];};
  let s=`<svg width="260" height="196" style="display:block;margin:auto">`;
  [25,50,75,100].forEach(v=>{s+=`<polygon points="${g.map((_,i)=>pt(i,R*v/100).join(',')).join(' ')}" fill="none" stroke="${line}"/>`;});
  g.forEach((_,i)=>{const [x,y]=pt(i,R);s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${line}"/>`;});
  s+=`<polygon points="${g.map((x,i)=>pt(i,R*x.calc.score/100).join(',')).join(' ')}" fill="${acc}" fill-opacity=".18" stroke="${acc}" stroke-width="1.8"/>`;
  g.forEach((x,i)=>{const [px,py]=pt(i,R*x.calc.score/100);s+=`<circle cx="${px}" cy="${py}" r="3" fill="${bcolor(x)}"/>`;const [lx,ly]=pt(i,R+16);s+=`<text x="${lx}" y="${ly+4}" font-size="10" fill="${txt}" text-anchor="middle">${esc(x.n.split(' ')[0])}</text>`;});
  return s+'</svg>';
}

/* ================= 右侧详情 ================= */
function crumb(n){const p=[];let x=N[n.p];while(x&&x.id!=='root'){p.unshift(x);x=N[x.p];}return `<div class="crumb">${p.map(x=>`<span data-go="${x.id}">${esc(x.n)}</span>`).join('<em>›</em>')}</div>`;}
function renderRight(){
  const R=document.getElementById('right');
  const n=S.sel&&N[S.sel];
  if(!n){R.innerHTML='<h3>详情</h3><small style="color:var(--sub)">点击树上的节点查看 / 记录。<br><br>层级：大板块 → 类别 → 子分支 → 知识点 →（进阶链）。<br>点节点右侧圆点展开下一层；进阶知识点在前置巩固值 ≥ 60 前显示为锁定（仍可记录）。</small>';return;}
  if(n.t===0){
    const ls=[];(function c(x){x.t>0?ls.push(x):0;x.children.forEach(c);})(n);
    const kind=n.depth===0?'总览':n.depth===1?'大板块':n.depth===2?'类别':'子分支';
    const childrenBars=n.children.filter(c=>c.t===0).map(c=>`<div class="card" data-go="${c.id}"><div class="row"><span>${esc(c.n)}</span><small>${c.calc.score} · ${c.calc.mastered}/${c.calc.cnt}</small></div><div class="bar" style="margin-bottom:0"><i style="width:${c.calc.score}%;background:${bcolor(c)||'var(--acc)'}"></i></div></div>`).join('');
    R.innerHTML=`${crumb(n)}<h3>${kind}</h3><h2 style="margin:0 0 6px;font-size:17px;font-weight:600">${esc(n.n)}</h2>
    <div class="stat"><div><b>${n.calc.score}</b><span>平均巩固值</span></div><div><b>${ls.length}</b><span>知识点</span></div><div><b>${ls.filter(x=>x.calc.score>=85).length}</b><span>已掌握</span></div></div>
    ${childrenBars?`<h3>${n.depth===0?'大板块':n.depth===1?'类别':'子分支'}进度</h3>${childrenBars}`:''}
    <h3>知识点 (${ls.length})</h3>
    ${ls.sort((a,b)=>a.t-b.t||b.calc.score-a.calc.score).map(x=>`<div class="card" data-go="${x.id}"><span class="tag t${x.t}">${TIERN[x.t]}</span>${x.locked?'🔒 ':''}${esc(x.n)}<small style="float:right">${x.calc.score}</small></div>`).join('')}`;
    R.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{S.sel=el.dataset.go;expandTo(el.dataset.go);render();});return;
  }
  const s=st(n.id),c=n.calc,today=new Date().toISOString().slice(0,10);
  const L=getLinks(),mine=(L.nodes&&L.nodes[n.id])||[];
  const tplSection='<h3>关联模板</h3>'
    +(mine.length
      ?mine.map(p=>'<div class="log"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p)+'</span><span><button class="mini" data-opentpl="'+esc(p)+'">查看</button> <button class="mini" data-unlink="'+esc(p)+'">×</button></span></div>').join('')
      :'<small style="color:var(--sub)">未关联。点击下方按钮从模板库选择。</small>')
    +'<div style="margin-top:8px"><button class="pri" id="linkTpl">+ 关联模板</button></div>';
  const par=N[n.p];
  R.innerHTML=`
  ${crumb(n)}
  <h2 style="margin:0 0 4px;font-size:17px;font-weight:600"><span class="tag t${n.t}">${TIERN[n.t]}</span>${esc(n.n)}</h2>
  <div><span class="tag dir">${DIRN[n.dirv]}</span>${par.t>0?`<small style="color:var(--sub)">前置：<span data-go="${par.id}" style="cursor:pointer;text-decoration:underline">${esc(par.n)}</span></small>`:''}</div>
  ${n.locked?`<div class="lock">🔒 前置「${esc(par.n)}」巩固值 ${par.calc.score} &lt; 60，建议先补前置（仍可记录）</div>`:''}
  <div class="score" style="color:${color(c.score)}">${c.score}<small>巩固值 · ${status(n)}</small></div>
  <div class="bar"><i style="width:${c.score}%;background:${color(c.score)}"></i></div>
  <div class="kv">
    <b>练习量</b><span>${c.wsum.toFixed(1)} / ${c.target}（${c.solved} 题，独立 ${c.indep}）</span>
    <b>自评等级</b><span>L${s.level}</span>
    <b>记忆保持</b><span>${c.days===null?'—':Math.round(c.ret*100)+'%（'+c.days+' 天前）'}</span>
  </div>
  <h3>说明</h3><div>${esc(n.d)}</div>
  <h3>识别信号</h3><div class="sig">${esc(n.s)}</div>
  <h3>推荐练习</h3><div>${n.pr.split(';').map(x=>`<div class="pr">${esc(x.trim())}</div>`).join('')}</div>
  ${tplSection}
  <h3>自评</h3>
  <div class="form">
    <label>掌握等级<select id="lv">${[0,1,2,3].map(i=>`<option value="${i}" ${s.level==i?'selected':''}>L${i} ${['不会','会写裸题','能识别应用','能变形改造'][i]}</option>`).join('')}</select></label>
    <label>目标题数<input id="tgt" type="number" min="1" value="${s.target}"></label>
  </div>
  <h3>添加刷题记录</h3>
  <div class="form">
    <input id="lp" placeholder="题号，如 CF1234D / P3372 / ABC300F">
    <input id="lr" type="number" placeholder="难度 (CF rating)">
    <input id="ld" type="date" value="${today}">
    <select id="lh"><option value="ac">独立做出</option><option value="sol">看题解后过</option></select>
    <input id="ln" placeholder="一句话：关键观察 / 转化链" style="grid-column:1/3">
  </div>
  <button class="pri" id="addLog">+ 记录</button> <button id="quick">今天刷了一题（快速）</button>
  <h3>刷题日志 (${s.logs.length})</h3>
  ${s.logs.slice().reverse().map((l,i)=>`<div class="log"><span><b>${esc(l.p||'?')}</b> ${l.r?'· '+esc(l.r):''} <small style="color:var(--sub)">${esc(l.d)} ${l.how==='sol'?'· 看题解':'· 独立'}</small>${l.n?'<br><small>'+esc(l.n)+'</small>':''}</span><button data-del="${s.logs.length-1-i}">×</button></div>`).join('')||'<small style="color:var(--sub)">还没有记录</small>'}
  <h3>备注 / 板子链接</h3><textarea id="note">${esc(s.note||'')}</textarea>`;
  R.querySelector('#lv').onchange=e=>{s.level=+e.target.value;render();};
  R.querySelector('#tgt').onchange=e=>{s.target=Math.max(1,+e.target.value||n.tg);render();};
  R.querySelector('#note').onchange=e=>{s.note=e.target.value;save();};
  R.querySelector('#addLog').onclick=()=>{s.logs.push({p:R.querySelector('#lp').value.trim(),r:R.querySelector('#lr').value,d:R.querySelector('#ld').value||today,how:R.querySelector('#lh').value,n:R.querySelector('#ln').value.trim()});render();};
  R.querySelector('#quick').onclick=()=>{s.logs.push({p:'',r:'',d:today,how:'ac',n:''});render();};
  R.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{s.logs.splice(+b.dataset.del,1);render();});
  R.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{S.sel=el.dataset.go;expandTo(el.dataset.go);render();});
  const lt=R.querySelector('#linkTpl');
  if(lt)lt.onclick=()=>{
    gotTplReply=false;
    notifyShell('requestTemplates');
    if(pendingTpl)clearTimeout(pendingTpl);
    pendingTpl=setTimeout(()=>{if(!gotTplReply){openTemplatePicker([],false);}},1500);
  };
  R.querySelectorAll('[data-opentpl]').forEach(b=>b.onclick=()=>{notifyShell2(0,{src:'acm-bridge',type:'jumpTemplate',path:b.dataset.opentpl});});
  R.querySelectorAll('[data-unlink]').forEach(b=>b.onclick=()=>{
    const p=b.dataset.unlink,L1=getLinks();
    L1.nodes[n.id]=(L1.nodes[n.id]||[]).filter(x=>x!==p);
    if(!L1.nodes[n.id].length)delete L1.nodes[n.id];
    delete L1.paths[p];setLinks(L1);render();
  });
}

/* ================= 与模板库（父页面）的桥接 ================= */
const LINK_KEY='acm_link_map';
let gotTplReply=false,pendingTpl=null;
function getLinks(){try{const o=JSON.parse(localStorage.getItem(LINK_KEY));return {paths:(o&&o.paths)||{},nodes:(o&&o.nodes)||{}};}catch(e){return {paths:{},nodes:{}};}}
function setLinks(L){try{localStorage.setItem(LINK_KEY,JSON.stringify(L));}catch(e){}notifyShell('linksChanged');}
function notifyShell(msg){try{window.parent.postMessage({src:'acm-bridge',type:msg},'*');}catch(e){}}
function notifyShell2(req,obj){try{window.parent.postMessage(obj,'*');}catch(e){}}
function pathOf(n){const p=[];let x=N[n.p];while(x&&x.id!=='root'){p.unshift(x.n);x=N[x.p];}return p.join(' / ');}
function leafList(){return LEAVES.map(n=>({id:n.id,name:n.n,tier:n.t,group:N[n.p].n,block:n.block?n.block.n:'',path:pathOf(n),dir:n.dirv}));}

let pickerBox=null;
function openTemplatePicker(list,hasDir){
  if(pickerBox)return;
  pickerBox=document.createElement('div');pickerBox.className='tpl-picker';
  const box=document.createElement('div');box.className='tpl-picker-box';
  if(!hasDir)box.innerHTML='<h3>+ 关联模板</h3><p style="color:var(--sub);font-size:12px">模板库尚未选择目录，请先到模板库视图选择。</p><button class="pri" id="pickClose">关闭</button>';
  else if(!list.length)box.innerHTML='<h3>+ 关联模板</h3><p style="color:var(--sub);font-size:12px">模板库中暂无文件。</p><button class="pri" id="pickClose">关闭</button>';
  else box.innerHTML='<h3>+ 关联模板</h3><input id="pickSearch" placeholder="搜索模板路径" style="width:100%;margin-bottom:6px">'+list.map(p=>'<div class="tpl-pick-item" data-path="'+esc(p)+'">'+esc(p)+'</div>').join('')+'<button class="pri" id="pickClose">关闭</button>';
  pickerBox.appendChild(box);document.body.appendChild(pickerBox);
  const close=()=>{pickerBox.remove();pickerBox=null;};
  box.querySelector('#pickClose').onclick=close;
  pickerBox.onclick=e=>{if(e.target===pickerBox)close();};
  const s=box.querySelector('#pickSearch');
  if(s)s.oninput=()=>{const qq=s.value.trim().toLowerCase();box.querySelectorAll('.tpl-pick-item').forEach(el=>{el.style.display=el.dataset.path.toLowerCase().includes(qq)?'':'none';});};
  box.querySelectorAll('.tpl-pick-item').forEach(el=>el.onclick=()=>{
    const path=el.dataset.path,id=S.sel;if(!id)return close();
    const L=getLinks();
    if(!L.nodes[id])L.nodes[id]=[];
    if(!L.nodes[id].includes(path))L.nodes[id].push(path);
    const old=L.paths[path];
    if(old&&old!==id&&L.nodes[old]){L.nodes[old]=L.nodes[old].filter(x=>x!==path);if(!L.nodes[old].length)delete L.nodes[old];}
    L.paths[path]=id;setLinks(L);close();render();
  });
}

window.addEventListener('message',e=>{
  const d=e.data;if(!d||typeof d!=='object'||d.src!=='acm-bridge')return;
  if(d.type==='selectNode'){if(N[d.id]){S.sel=d.id;expandTo(d.id);render();}}
  else if(d.type==='getLeaves'){notifyShell2(d.req,{src:'acm-bridge',type:'leaves',req:d.req,list:leafList()});}
  else if(d.type==='linksChanged'){render();}
  else if(d.type==='templates'){if(pendingTpl){clearTimeout(pendingTpl);pendingTpl=null;}gotTplReply=true;if(pickerBox){pickerBox.remove();pickerBox=null;}openTemplatePicker(d.list||[],!!d.ok);}
});
window.addEventListener('load',()=>notifyShell('ready'));
if('IntersectionObserver' in window){
  new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting&&!fitted){fitted=true;fitView();}});},{threshold:0}).observe(document.getElementById('tree'));
}
window.addEventListener('resize',()=>{if(!fitted)fitView();});

render();fitView();
if(S.migrated){toast('已从旧版数据迁移刷题记录');}
