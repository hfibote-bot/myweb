# GitHub 网页版冲突处理（小白版）

如果你在 PR 页面看到 **This branch has conflicts that must be resolved**，按下面做：

## 1) 打开冲突编辑器
在 PR 页面点击 **Resolve conflicts**。

## 2) 只保留一套代码
冲突文件里会看到三段标记：

- `<<<<<<< HEAD`（你当前分支）
- `=======`
- `>>>>>>> main`（目标分支）

做法：
- 保留你要的那一段代码；
- 删除另一段；
- 把这三行标记全部删掉（`<<<<<<<` / `=======` / `>>>>>>>`）。

## 3) 温室模块怎么选
如果冲突发生在 `greenhouse.html` / `greenhouse.js`，优先保留带这些关键词的版本：

- `exportCsvBtn`
- `exportSvgBtn`
- `exportPngBtn`
- `build3DSvg`
- `calcProject`

## 4) 提交冲突修复
- 点击 **Mark as resolved**
- 再点 **Commit merge**

## 5) 合并前 30 秒自检
打开页面确认：
- 能“生成清单与图纸”
- 三个导出按钮可点击
- 页面没有空白或报错

---

## 最常见误区
- **红色行不是让你手动删**（在普通 diff 页面）
- 只有在 `Resolve conflicts` 页面，且出现 `<<<<<<< ======= >>>>>>>` 时，才需要手动编辑。
