% 表6-1 测试环境与工具清单
% 数据
categories = {'服务器'; '数据库'; '前端运行时'; '桌面浏览器'; '移动测试机'; ...
              'Capacitor'; '大模型'; '压测工具'; '接口测试'; '端到端测试'};
tools = {'阿里云 ECS ecs.g7.large'; 'MySQL'; 'Node.js / pnpm'; ...
         'Chrome / Edge'; 'iPhone 13 / 小米 13'; 'Capacitor'; ...
         'DeepSeek'; 'k6'; 'Postman + Newman'; 'Playwright'};
versions = {'2 vCPU / 8 GiB / Ubuntu 22.04'; '8.0.36，InnoDB，utf8mb4'; ...
            '20.12 / 9.4'; '125 / 125'; 'iOS 17 / HyperOS 1'; ...
            '6.1（iOS + Android 双平台）'; 'deepseek-chat，上下文 64K'; ...
            '0.50，脚本化场景压测'; '10.24'; '1.45，Chromium / WebKit'};

fig = figure('Units', 'pixels', 'Position', [100 100 900 420], ...
             'Color', 'white', 'Visible', 'off');

% 隐藏坐标轴
ax = axes('Parent', fig, 'Position', [0 0 1 1], 'Visible', 'off');

% 表头
colNames = {'类别', '软硬件 / 工具', '版本 / 配置'};
colWidths = [120, 320, 360];
nRows = length(categories);
nCols = 3;
rowHeight = 32;
headerHeight = 38;
leftMargin = 60;
topY = 370;

yEnd = topY - headerHeight - nRows * rowHeight;

% 绘制标题
text(450, topY + 30, '表 6-1  测试环境与工具清单', ...
     'FontName', 'SimHei', 'FontSize', 14, 'FontWeight', 'bold', ...
     'HorizontalAlignment', 'center');

% 绘制表头背景
xStart = leftMargin;
xEnd = leftMargin + sum(colWidths);
rectangle('Position', [xStart, topY - headerHeight, sum(colWidths), headerHeight], ...
          'FaceColor', [0.25 0.35 0.55], 'EdgeColor', 'black', 'LineWidth', 1.2);

% 表头文字
cumX = leftMargin;
for c = 1:nCols
    text(cumX + colWidths(c)/2, topY - headerHeight/2, colNames{c}, ...
         'FontName', 'SimHei', 'FontSize', 11, 'FontWeight', 'bold', ...
         'Color', 'white', 'HorizontalAlignment', 'center');
    cumX = cumX + colWidths(c);
end

% 绘制数据行
for r = 1:nRows
    yTop = topY - headerHeight - (r-1) * rowHeight;
    % 交替行背景色
    if mod(r, 2) == 0
        bgColor = [0.94 0.96 0.98];
    else
        bgColor = [1 1 1];
    end
    rectangle('Position', [xStart, yTop - rowHeight, sum(colWidths), rowHeight], ...
              'FaceColor', bgColor, 'EdgeColor', [0.7 0.7 0.7], 'LineWidth', 0.5);

    % 行数据
    rowData = {categories{r}, tools{r}, versions{r}};
    cumX = leftMargin;
    for c = 1:nCols
        text(cumX + colWidths(c)/2, yTop - rowHeight/2, rowData{c}, ...
             'FontName', 'SimSun', 'FontSize', 10, ...
             'HorizontalAlignment', 'center');
        cumX = cumX + colWidths(c);
    end
end

% 外框
rectangle('Position', [xStart, yEnd, sum(colWidths), headerHeight + nRows * rowHeight], ...
          'EdgeColor', 'black', 'LineWidth', 1.5);

axis off;
xlim([0 900]);
ylim([0 420]);

% 保存
exportgraphics(fig, 'D:\cursor项目-毕业设计\表6-1_测试环境与工具清单.png', ...
               'Resolution', 200);
disp('表 6-1 已保存为 PNG');
exit;
