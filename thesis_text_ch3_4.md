## 第 3 章 系统需求分析

### 3.1 系统总体需求

#### 3.1.1 功能总体需求

LinkE 领客协同项目定位为面向中小型企业的轻量化移动端协同管理 APP，其核心目标是在单一移动入口内聚合分散于多套异构业务系统的待办与消息，降低员工在不同系统间的切换成本。结合对目标企业的调研，系统在功能层面需要满足以下八项总体需求：一是提供统一的移动工作台，实现待办数量、快捷入口与今日概览的聚合展示；二是构建消息中心，支持 bot、group、user 三类消息的汇总与多轮会话；三是实现统一协同待办的集中管理，支持 pending、processing、done 三态流转与左右滑动手势操作；四是内嵌 DeepSeek 大语言模型驱动的 AI 助手，支持角色化对话；五是提供 SAP ERP、金蝶云财务、泛微 OA、Salesforce CRM 四大异构系统的集成视图与状态监控；六是对外暴露 OpenAPI 接口，支持异构系统通过 Webhook 推送业务事件；七是实现基于 admin 与 staff 的 RBAC 双角色权限隔离；八是提供 OA 请假审批、会议室预定与 CRM 客户管理、合同评审等子系统能力。

#### 3.1.2 非功能总体需求

除功能性需求外，系统还需满足五个维度的非功能性约束。性能上，移动端首屏加载时间应控制在 2 秒以内，待办状态切换及消息渲染延迟不超过 300 毫秒；可用性上，关键交互路径不超过三级，滑动、点击等手势需符合主流移动应用习惯；安全性上，通过 RBAC 机制保障 admin 与 staff 数据视图互不越权，OpenAPI 接口需预留签名校验扩展点；兼容性上，需适配 iOS Safari、Android Chrome 与桌面 Chrome/Edge 三类主流浏览器，并通过 Tailwind 响应式断点兼容 375px 至 1920px 的屏幕宽度；可维护性上，采用组件化与 Hooks 抽象，核心业务逻辑与视图解耦，便于后续迭代与后端化迁移。

### 3.2 角色用例分析

#### 3.2.1 管理者（admin）用例

管理者角色由张总（总经办）扮演，其用例围绕"全局掌控"与"战略决策"展开。首先，admin 登录后进入数据驾驶舱视图，可查看全公司当日待审批数量、待签字文件数量、紧急任务占比等 KPI 指标，并通过集成状态卡片实时了解四大异构系统连接情况。其次，admin 可监控全公司待办池，包括来自 SAP 的采购订单审批、来自金蝶的财务签字、来自泛微 OA 的制度发布以及来自 Salesforce 的大客户合同评审，支持按优先级与来源筛选。再次，admin 可唤起 AI 助手进行战略级提问，例如"本月关键合同风险点"或"跨部门任务瓶颈分析"，系统通过角色化 system prompt 返回决策建议。最后，admin 独占 OpenAPI 控制台与集成管理入口，可查看接口调用日志、手动触发推送测试，并切换各异构系统的连接状态 [1]。

#### 3.2.2 普通员工（staff）用例

普通员工角色由李专员（销售部）扮演，其用例聚焦于"个人执行"与"高效沟通"。在工作台页面，staff 看到的是面向个人的今日待办清单与常用应用入口，如请假申请、会议室预定、客户跟进等。在待办中心，staff 通过左滑手势将 pending 态任务推进至 processing，完成后再次左滑进入 done；若误操作则通过右滑回退，整个过程无需跳转至原始异构系统。在消息中心，staff 可与 AI 助手、部门群组以及同事进行一对一沟通，支持发送文本与文件消息，历史记录通过 history 字段本地持久化。此外，staff 可在任务粒度上唤起 AI 指导，例如"帮我起草一份请假理由"或"分析该客户跟进策略"，AI 将基于员工视角给出具体、可执行的操作建议而非战略建议。

### 3.3 业务流程分析

#### 3.3.1 异构系统推送与待办消息联动流程

异构系统推送流程是 LinkE 的核心联动机制，由前端封装的 handlePushTodo 函数统一编排。当 SAP、金蝶、泛微或 Salesforce 通过 Webhook 推送业务事件后，系统首先根据 source 字段识别来源，继而在 todos 数组中追加一条 status 为 pending 的待办记录，并分配对应的 priority 与 type。与此同时，系统在 messages 数组中自动生成一条 bot 类型消息，name 字段对应"OA 审批助手"或"CRM 商机助手"等逻辑机器人，unread 置为 true，并将待办关键信息写入 history 首条记录。用户点击通知即可直接跳转至待办详情，实现"推送即提醒、提醒即可处理"的闭环。

#### 3.3.2 待办三态流转流程

待办采用 pending、processing、done 三态有限状态机。初始状态为 pending，表示任务已推送但尚未启动；用户在列表视图对卡片执行左滑手势时，状态推进至 processing，表示任务已开始处理；再次左滑则进入 done 终态，卡片折叠至"已完成"分组。若用户误操作，可通过右滑回退至上一状态。整个流转在前端通过 setTodos 不可变更新实现，并在状态变化时同步更新对应消息卡片的标签与未读计数。

#### 3.3.3 AI 智能助手多轮对话流程

AI 智能助手基于 DeepSeek 大语言模型构建，交互入口位于消息中心的 bot 会话。用户发送消息后，前端首先将当前 role 传入 getSystemPrompt(role) 函数生成对应的 system prompt，继而拼接 history 中的历史消息形成 messages 数组，最后通过 fetch 调用 DeepSeek Chat Completions 接口。返回结果以流式或一次性方式追加至 history，并通过 React 状态驱动视图刷新。为避免上下文膨胀，系统仅保留最近 20 轮对话，并对超长输入进行截断提示。整个流程在前端纯客户端完成，无需额外后端中转 [2]。

#### 3.3.4 OpenAPI Push/Pull 双向集成流程

OpenAPI 采用 Push 与 Pull 双向模式。Push 方向上，异构系统通过 POST /v1/erp/webhook、POST /v1/oa/approval/webhook、POST /v1/crm/opportunity/webhook 三个端点向 LinkE 推送事件，服务端接收后触发待办与消息联动；Pull 方向上，LinkE 通过 POST /v1/orders/sync 主动拉取 ERP 订单数据以刷新本地视图。所有端点统一返回 `{code:200,data:{...}}` 结构，便于客户端统一解析。每次调用均会在 APILog 中留痕，包含 direction、source、endpoint、timestamp 与 status 五个字段，支撑后续的审计与追溯。

### 3.5 实体关系模型

在上述实体基础上，可归纳出 LinkE 的核心实体关系模型。User 实体与 Todo 实体存在一对多关系，一个用户可拥有若干待办；User 与 Message 同样为一对多关系，体现为其参与的若干会话。Todo 与 Message 之间通过 source 字段形成弱关联，异构系统推送一条 Todo 的同时生成一条关联 Message。Integration 实体与 APILog 实体为一对多关系，一个集成项对应多条历史调用日志。APILog 通过 source 字段反向关联 Integration，同时通过 endpoint 字段间接关联可能产生的 Todo 与 Message，从而构成"用户—任务—消息—集成—日志"五元闭环。

## 第 4 章 系统设计

### 4.1 设计思想与原则

#### 4.1.1 "消息驱动、事找人"设计思想

传统企业信息化中，员工需要主动登录 ERP、OA、CRM 等多套系统"找事做"，信息获取成本高、响应不及时。LinkE 在设计之初即确立了"消息驱动、事找人"的核心思想：将异构系统的业务事件统一抽象为消息，通过 Webhook 推送至移动端，再由前端基于 handlePushTodo 机制自动派发为待办与通知。对员工而言，任何需要处理的事项都以消息形式"找上门来"，无需记忆各系统入口；对管理者而言，全公司的业务流转以信息流的形式可视化呈现。该思想从根本上扭转了"人找系统"的被动交互，转变为"系统找人"的主动协同，显著压缩了事项从产生到处理的时延，契合企业移动办公的深度需求。

#### 4.1.2 "千人千面" RBAC 权限隔离原则

企业协同场景中，不同角色对信息的关注点存在本质差异：管理者关注全局与决策，员工关注个人与执行。LinkE 以 RBAC 模型为基础，建立 admin 与 staff 双角色体系，并在前端通过 role 字段驱动组件差异化渲染。同一功能模块（如工作台、AI 助手、待办中心）在不同角色下呈现不同数据集、不同视觉风格与不同操作入口，真正实现"千人千面"。尤其在 AI 助手场景，getSystemPrompt(role) 函数为两类角色注入不同人格设定与知识边界，确保输出内容与岗位职责精准匹配，避免越权建议与信息噪声。

#### 4.1.3 "轻量化聚合"微前端门户原则

LinkE 并不试图替代 SAP、金蝶、泛微、Salesforce 等专业系统的深度能力，而是作为一个"轻量化聚合门户"存在。其设计原则是：只聚合高频、跨系统、移动化的 20% 核心事项，其余 80% 的深度业务仍回归原系统。在技术实现上，采用 React 19 单页应用承载门户外壳，各子系统以视图组件的形式嵌入，通过统一的路由与状态管理进行编排。这种"薄聚合、重跳转"的门户形态既避免了重复造轮子，又为企业提供了一个统一入口，符合微前端理念中"聚合而非替代"的价值主张 [3]。

### 4.2 系统总体结构设计

#### 4.2.1 分层架构设计

LinkE 采用典型的四层分层架构，自上而下分别为展示层、业务层、API 网关层与异构数据源层。

展示层基于 React 19、Vite 与 Tailwind CSS 构建，承担视图渲染与交互响应职责，核心组件包括 MobileDashboard、MessageCenter、TodoCenter、Settings、OpenAPIConsole 五大页面以及 TodoCard、MessageItem、IntegrationCard 等可复用单元，通过 React Hooks 实现局部状态管理。业务层由自定义 Hooks 与纯函数模块构成，封装 handlePushTodo、handleSwipeTransition、getSystemPrompt 等核心业务逻辑，保证视图层的无状态与可测试性。API 网关层在本项目中以前端 Mock Server 形式存在，对外暴露 /v1/orders/sync、/v1/erp/webhook、/v1/oa/approval/webhook、/v1/crm/opportunity/webhook 四个 OpenAPI 端点，对内统一 `{code:200,data:{...}}` 响应格式，并负责日志留痕。异构数据源层对应 SAP ERP、金蝶云财务、泛微 OA、Salesforce CRM 及 DeepSeek LLM，通过 Webhook 或 HTTPS 接口与网关层交互。四层之间严格单向依赖，上层可调用下层能力但下层不感知上层存在，为后续后端化迁移预留清晰边界。

#### 4.2.2 移动端自适应响应式布局方案

考虑到企业用户存在移动端与桌面端双重使用场景，LinkE 采用 Tailwind CSS 的响应式断点体系实现自适应布局。默认以 375px 的主流移动设备宽度为基准，采用底部 Tab Bar 作为一级导航，页面内容占据全屏；当视口宽度达到 md（768px）断点时，布局通过 md:flex 切换为桌面形态，左侧呈现固定侧边栏导航，右侧为主内容区，底部 Tab Bar 自动隐藏。待办卡片、消息列表等内容区采用 flex-col 与 grid 混合布局，在桌面端自动扩展为双列或三列瀑布流。此外，手势交互如左滑推进、右滑回退在桌面端退化为按钮点击，保证交互完备性。整体方案以一套代码覆盖 375px 至 1920px 的全尺寸屏幕，显著降低开发与维护成本。

### 4.3 系统功能模块设计

#### 4.3.1 移动工作台模块

移动工作台是 LinkE 的首屏入口，承担信息聚合与快捷导航的双重职责。模块顶部为欢迎语与角色头像，中部为 KPI 卡片区域，admin 视图展示全公司待审批、待签字、紧急任务等指标，staff 视图展示个人今日待办数与未读消息数。下部为快捷应用入口网格，按高频业务分类聚合请假、会议室、客户、合同等子系统跳转。模块通过 useMemo 缓存派生数据，确保在待办状态变化时仅进行增量渲染。

#### 4.3.2 消息中心模块

消息中心实现 bot、group、user 三类消息的统一管理。模块顶部为搜索栏与筛选标签，中部为会话列表，按 time 字段倒序排列并以 unread 角标提示未读数。点击会话进入详情视图，展示 history 数组所对应的消息流，支持文本与文件两种消息类型，其中 file 类型附带 name 与 size 元数据。bot 会话额外接入 DeepSeek 接口以实现多轮 AI 对话。

#### 4.3.3 统一协同待办模块

统一协同待办模块汇聚来自四大异构系统的事项，采用 Tab 切换 pending、processing、done 三态分组展示。每条待办卡片展示 source、title、type、priority 与 time 五要素，并通过左右滑动手势触发状态流转。模块内置筛选器，支持按来源、类型、优先级多维过滤，admin 角色可查看全公司池，staff 角色仅可查看个人分派项。

#### 4.3.4 设置中心与 RBAC 模块

设置中心集成账户信息、角色切换、主题色、缓存清理与关于页面。RBAC 机制在此模块以可视化形式呈现：admin 可切换至 staff 视图进行体验，staff 则无法反向提权。角色切换通过修改全局 role 状态触发全应用重新渲染，并通过 localStorage 持久化偏好设置，保证刷新后状态保留。

#### 4.3.5 OpenAPI 控制台模块

OpenAPI 控制台为 admin 独占模块，提供 4 个端点的在线文档、请求示例、Mock 触发按钮与调用日志视图。日志视图对应 APILog 实体，按 timestamp 倒序展示 direction、source、endpoint、status 等字段，并以红绿色块区分成功与失败。管理员可通过控制台手动触发异构系统推送，用于演示或回归测试。

#### 4.3.6 OA 子系统模块

OA 子系统内嵌请假审批与会议室预定两大高频场景。请假审批提供申请表单、审批流可视化与历史记录；会议室预定则提供日历视图、时段选择与即时确认。两者共享泛微 OA 的 Webhook 通道，申请提交后即向 admin 推送 bot 消息与待办卡片，形成端到端闭环。

#### 4.3.7 CRM 子系统模块

CRM 子系统对接 Salesforce，包含客户管理与合同评审两大功能。客户管理提供客户列表、拜访记录与商机漏斗视图；合同评审提供合同详情、条款比对与电子签字入口。当 Salesforce 商机阶段变更时，通过 /v1/crm/opportunity/webhook 推送事件，自动生成合同评审待办并通知相关角色。

### 4.4 接口交互设计

#### 4.4.1 OpenAPI 标准接口规范

LinkE 对外暴露的 OpenAPI 遵循 RESTful 风格，所有端点采用 HTTPS POST 方法，请求体为 JSON，响应体统一为 `{code:200,data:{...}}` 结构。错误场景下 code 不为 200 时，data 字段替换为 message 字段承载错误描述。

#### 4.4.2 异构系统集成设计

异构系统集成采用"Webhook 接入 + 适配器转换"的双层结构。Webhook 层负责接收原始 JSON payload，适配器层将 SAP 的 PurchaseOrder、金蝶的 VoucherSign、泛微的 ApprovalNode、Salesforce 的 Opportunity 等异构数据结构统一转换为 LinkE 内部的 Todo 与 Message 领域模型。适配器通过 source 字段分派，各适配器独立实现，互不影响，便于新增系统时横向扩展。对于本项目的前端 Mock 实现，适配逻辑由 pushHandlers 对象集中承载，key 为 source 取值，value 为转换函数。

#### 4.4.3 DeepSeek API 接口设计

DeepSeek API 交互由 sendToDeepSeek 函数封装，核心在于 getSystemPrompt(role) 的双 prompt 体系。当 role 为 admin 时，system prompt 注入"你是企业高层决策顾问，擅长战略级风险分析、跨部门协调与资源调度建议"的人格设定；当 role 为 staff 时，则注入"你是一线员工的贴身助理，擅长文档起草、任务拆解与客户沟通话术"的设定。两套 prompt 在语气、颗粒度与建议维度上形成显著差异，从而使同一问题在不同角色下获得截然不同的回答。请求采用 Chat Completions 协议，messages 数组拼接 system、historical user/assistant 与当前 user 消息，温度参数 admin 侧设为 0.3 以强调稳健，staff 侧设为 0.7 以鼓励灵活。

#### 4.4.4 接口调用日志与追溯机制

所有 OpenAPI 调用均通过统一中间件写入 APILog，字段包括 id、direction、source、endpoint、timestamp 与 status。日志以环形缓冲方式在前端保留最近 200 条，超出后按 FIFO 淘汰。控制台视图提供按 source 与 status 的筛选能力，便于管理员快速定位异常调用。未来后端化后，该机制可无缝迁移至 ELK 或同类日志平台，实现长期审计。

### 4.5 数据库设计

#### 4.5.1 概念模型设计

尽管本项目当前采用前端 Mock 数据，数据库设计仍遵循"如果后端化则如何建表"的思路进行前瞻设计。概念模型在 3.5 节 ER 图基础上进一步细化，核心实体为 User、Todo、Message、Integration、APILog 五类，关系包括 User-Todo（1:N）、User-Message（1:N）、Integration-APILog（1:N）、Todo-Message（1:1 弱关联）。

#### 4.5.2 逻辑模型设计

逻辑模型将概念实体映射为关系模式。主键采用 UUID 字符串以避免分布式冲突，外键通过 user_id、integration_id 等字段显式关联。枚举字段（role、status、priority、type、direction）在数据库层以 VARCHAR + CHECK 约束或 ENUM 类型实现，保证数据合法性。history 数组在 Message 表中以子表 message_history 形式拆分建模，避免 JSON 字段带来的查询性能劣化。

#### 4.5.3 物理表结构设计

选取 todos 表作为物理结构示例，其建表语句如下：

```sql
CREATE TABLE todos (
  id           VARCHAR(32)  NOT NULL PRIMARY KEY,
  user_id      VARCHAR(32)  NOT NULL,
  source       VARCHAR(32)  NOT NULL,
  title        VARCHAR(128) NOT NULL,
  type         VARCHAR(16)  NOT NULL,
  priority     VARCHAR(8)   NOT NULL,
  time         DATETIME     NOT NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'pending',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_status (user_id, status),
  INDEX idx_source_time (source, time)
);
```

其余实体表遵循相同建模风格，通过用户 ID 与状态字段的复合索引优化高频列表查询，通过来源与时间的复合索引支持异构系统分片统计。该物理设计兼顾写入性能与查询效率，为 LinkE 从前端 Mock 向真实后端演进提供了清晰、可落地的数据底座。
