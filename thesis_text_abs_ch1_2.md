# 中文摘要

随着企业数字化转型的深入推进，协同办公软件已成为现代企业信息化建设的核心基础设施。然而，多数中大型企业在长期信息化过程中沉淀了 SAP ERP、金蝶云财务、泛微 OA、Salesforce CRM 等异构业务系统，形成了严重的数据孤岛现象，员工在多套系统间频繁切换，协同效率低下，移动化体验普遍不足。

针对上述问题，本课题设计并实现了一款面向企业协同管理的轻量化移动端 Web 应用——LinkE 领客协同。本系统采用 React 19 组件化框架与 Vite 8 构建工具搭建前端，使用 Tailwind CSS 3 实现响应式样式，通过 Capacitor 将 Web 应用封装为 Android APK，从而在统一代码基础上同时覆盖桌面浏览器和移动端原生壳体两种形态。

在功能设计层面，本系统提出"消息驱动、事找人"的核心设计思想，以 RBAC（Role-Based Access Control，基于角色的访问控制）双角色模型为基础，为总经办管理员和销售部普通员工构建"千人千面"的个性化工作台；系统通过 OpenAPI Push/Pull 双向集成机制聚合四大异构业务系统的数据，并集成 DeepSeek 大语言模型 API 提供多轮对话、角色感知与文本润色等智能辅助能力。

经功能测试与兼容性测试验证，本系统运行稳定、交互流畅，在信息聚合、权限隔离和智能化体验方面达到了预期目标，为中小企业低成本实现移动端协同管理提供了一种可行方案。

**关键词**：企业协同办公；移动端应用；RBAC 权限模型；大语言模型；异构系统集成；React；OpenAPI；响应式设计

# Abstract

With the rapid advancement of enterprise digital transformation, collaborative office software has become a critical component of modern corporate information infrastructure. However, most medium and large-sized enterprises have accumulated heterogeneous business systems such as SAP ERP, Kingdee Cloud Finance, Weaver OA and Salesforce CRM over long periods of informatization, resulting in severe data silos. Employees are forced to switch frequently between multiple systems, which leads to low collaboration efficiency and a poor mobile experience.

To address these issues, this project designs and implements a lightweight mobile web application for enterprise collaborative management, named LinkE. The front end is built with React 19 and Vite 8, styled with Tailwind CSS 3 for responsive layout, and packaged into an Android APK through Capacitor, enabling a single codebase to simultaneously cover desktop browsers and native mobile shells.

In terms of functional design, this system proposes a core concept of "message-driven, tasks find people". Based on an RBAC dual-role model, it constructs personalized workbenches for the general manager administrator and ordinary sales staff. The system aggregates data from four heterogeneous business systems through a bidirectional OpenAPI Push/Pull integration mechanism, and integrates the DeepSeek large language model API to provide intelligent assistance including multi-turn dialogue, role-aware responses and text polishing.

Functional and compatibility tests demonstrate that the system runs stably with smooth interaction, achieving the expected goals in information aggregation, permission isolation and intelligent user experience, providing a feasible low-cost solution for small and medium-sized enterprises to realize mobile collaborative management.

**Keywords**: Enterprise Collaboration; Mobile Application; RBAC; Large Language Model; Heterogeneous System Integration; React; OpenAPI; Responsive Design
