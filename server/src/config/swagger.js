const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'LinkE 领客协同平台 API',
      version: '1.0.0',
      description:
        'LinkE（领客协同）跨系统协同办公平台 RESTful API 接口规范。' +
        '提供认证授权、待办管理、消息中心、AI 智能助手及异构系统集成等功能。',
      contact: {
        name: 'LinkE Team',
      },
    },
    servers: [
      { url: 'http://localhost:3001', description: '本地开发服务器' },
    ],
    tags: [
      { name: 'Auth', description: '认证与授权（登录/注册/当前用户）' },
      { name: 'Todos', description: '待办事项管理' },
      { name: 'Messages', description: '消息中心与会话管理' },
      { name: 'AI', description: 'DeepSeek AI 智能助手' },
      { name: 'Integrations', description: '异构系统集成（ERP/OA/CRM/财务）' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '登录后获取的 JWT Token。格式：Bearer {token}',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: 'U001' },
            name:      { type: 'string', example: '张总' },
            email:     { type: 'string', example: 'admin@linke.com' },
            role:      { type: 'string', enum: ['admin', 'staff', 'finance', 'erp'] },
            avatar:    { type: 'string', example: '👨‍💼' },
            dept:      { type: 'string', example: '总经办' },
          },
        },
        Todo: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            userId:    { type: 'string', example: 'U001' },
            source:    { type: 'string', example: 'ERP系统' },
            title:     { type: 'string', example: 'Q3季度原材料采购审批' },
            type:      { type: 'string', enum: ['审批', '签字', '预定', '任务', '业务推送'] },
            priority:  { type: 'string', enum: ['high', 'medium', 'low'] },
            status:    { type: 'string', enum: ['pending', 'processing', 'done'] },
            system:    { type: 'string', nullable: true, example: 'erp' },
            workflowInstanceId: { type: 'string', nullable: true },
            workflowStep:       { type: 'integer', nullable: true },
            workflowTotalSteps: { type: 'integer', nullable: true },
            workflowName:       { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Integration: {
          type: 'object',
          properties: {
            id:               { type: 'string', example: 'erp' },
            name:             { type: 'string', example: 'SAP ERP' },
            status:           { type: 'string', enum: ['connected', 'disconnected', 'error'] },
            color:            { type: 'string', example: 'bg-blue-600' },
            webhookEndpoint:  { type: 'string', example: 'POST /v1/erp/webhook' },
            createdAt:        { type: 'string', format: 'date-time' },
            updatedAt:        { type: 'string', format: 'date-time' },
          },
        },
        IntegrationLog: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            integrationId: { type: 'string', example: 'erp' },
            direction:     { type: 'string', enum: ['push', 'pull'] },
            source:        { type: 'string', example: 'SAP ERP' },
            endpoint:      { type: 'string', example: 'POST /v1/erp/webhook' },
            payload:       { type: 'string' },
            status:        { type: 'string', enum: ['success', 'error'] },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        MessageThread: {
          type: 'object',
          properties: {
            id:           { type: 'integer' },
            type:         { type: 'string', enum: ['bot', 'group', 'user'] },
            name:         { type: 'string' },
            color:        { type: 'string' },
            tag:          { type: 'string', nullable: true },
            pinned:       { type: 'boolean' },
            lastContent:  { type: 'string' },
            lastTime:     { type: 'string' },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            senderId:   { type: 'string', nullable: true },
            senderType: { type: 'string', enum: ['self', 'other'] },
            senderName: { type: 'string', nullable: true },
            type:       { type: 'string', enum: ['text', 'file'] },
            content:    { type: 'string' },
            fileSize:   { type: 'string', nullable: true },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: '错误描述' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
