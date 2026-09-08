# 订单管理系统

多人共享的客户订单跟踪网页。前端发布于 GitHub Pages，订单数据与登录由 Supabase 提供。

## 主要功能

- 客户需求、合同、发票、发货、回款和客户反馈跟踪
- 多条“快递公司 + 快递单号”物流记录
- 首页统计卡片跳转与订单筛选
- 多人共享同一套订单数据
- CSV 导出、记住密码和 30 天免登录

## 云端配置

1. 在 Supabase SQL Editor 执行 `supabase-order-schema.sql`。
2. 在 Authentication 中创建 `admin@orderdesk.internal` 登录用户。
3. GitHub Pages 从仓库 `main` 分支根目录发布。
