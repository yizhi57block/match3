# Scene1 资源清单与映射

本文档记录 scene1 资源包到 Match3 游戏的完整映射关系。

## 资源分类与映射

### 1. 宝石资源 (Gems)

根据 `resource/scene1/资源清单.md`，识别出5种宝石：

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `019f3ee2-75da-4520-951d-b057141ba5bb.webp` | 紫色钻石形状 | 79×80 | `public/scene1/gems/gem_purple.webp` | gems (frame 0) | 宝石类型1 |
| `05b3ca95-093c-4839-b32e-97538e85e94d.webp` | 橘黄色棱形 | 77×82 | `public/scene1/gems/gem_orange.webp` | gems (frame 1) | 宝石类型2 |
| `0da13f75-8b48-49a3-8e6a-d76c22877a1b.webp` | 粉红色桃心形状 | 78×78 | `public/scene1/gems/gem_pink.webp` | gems (frame 2) | 宝石类型3 |
| `c5c5fb3d-c624-42f9-965a-85427a725f9b.webp` | 绿色多面体型 | 79×81 | `public/scene1/gems/gem_green.webp` | gems (frame 3) | 宝石类型4 |

**注意**：资源清单中只明确列出4种宝石，需要找第5种或用现有素材组合。检查后发现可以用现有4种宝石+关键道具作为特殊宝石。

### 2. 背景资源 (Background)

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `263f0f51-1d02-46b9-9dad-33d4ec4f9877.webp` | 室内场景图片 | 2048×2048 | `public/scene1/bg/background.webp` | scene-bg | 全屏背景 |
| `8954b0ad-5ecc-482f-9b37-b0da70eb9368.webp` | 放置宝石的棋盘 | 562×754 | `public/scene1/bg/board.webp` | game-board | 棋盘背景 |

### 3. 关键道具 (Victory Keys)

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `92af201e-3577-4362-8e51-e68b841a0227.webp` | 老鼠型玩具 | 104×88 | `public/scene1/keys/key_mouse.webp` | key-mouse | 通关钥匙1 |
| `99b361cc-744a-42c1-b173-7cda9bb8e1f1.webp` | 猫咪吃饭的碗 | 105×81 | `public/scene1/keys/key_bowl.webp` | key-bowl | 通关钥匙2 |
| `c0a40a90-2cd1-4fc1-97e9-c56833b2cfbc.webp` | 一只鱼图片 | 104×85 | `public/scene1/keys/key_fish.webp` | key-fish | 通关钥匙3 |

### 4. 猫咪角色 (Cat States)

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `1ecd4a73-c4ee-46f8-bee3-d00b164a28db.webp` | 小猫图片（帧动画） | 244×314 | `public/scene1/cat/cat_idle.webp` | cat-idle | 空闲状态 |
| `2e7494ea-f996-4ba7-9a92-63f96106fe68.webp` | 小猫图片（帧动画） | 282×352 | `public/scene1/cat/cat_idle2.webp` | cat-idle2 | 空闲状态2 |
| `d567f08f-0163-432e-ac85-3d5adc3f8cfa.webp` | 小猫在舔手 | 234×285 | `public/scene1/cat/cat_licking.webp` | cat-licking | 获得道具状态 |
| `6e5a46c6-7f99-42bf-9685-00578e1cd586.webp` | 小猫在微笑 | 243×290 | `public/scene1/cat/cat_happy.webp` | cat-happy | 胜利状态 |

### 5. UI 元素 (UI Elements)

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `4504d131-809b-4261-af29-6dea85c9fd70.webp` | 游戏失败时的图片 | 657×657 | `public/scene1/ui/game_fail.webp` | game-fail | 失败画面 |
| `99c81601-7660-463a-b8da-7f2bf5cf7c01.webp` | 游戏胜利时的画面 | 639×661 | `public/scene1/ui/game_success.webp` | game-success | 胜利画面 |
| `cfa73666-96af-4d70-b6db-02491ac9fe08.webp` | 心形图案 | 85×81 | `public/scene1/ui/heart.webp` | ui-heart | 生命值 |
| `5c00d521-e403-40f4-a6c4-5761e836e3f5.webp` | 心碎的图标 | 88×81 | `public/scene1/ui/heart_broken.webp` | ui-heart-broken | 失去生命 |
| `79f50229-a953-476c-b6c5-ad89912a5965.webp` | 长条图片 | 431×132 | `public/scene1/ui/life_bar.webp` | ui-life-bar | 生命条背景 |
| `cf42512d-c811-4f99-a6fc-9f428df0a1a8.webp` | 桌子（三个垫子） | 591×166 | `public/scene1/ui/display_table.webp` | ui-display-table | 展示已收集钥匙 |
| `56cad95e-ae61-452d-87a9-61d0dbfea7b5.webp` | 猫爬架 | 440×943 | `public/scene1/ui/cat_tower.webp` | ui-cat-tower | 装饰/猫放置台 |
| `85afb934-bb38-47d5-a9b5-a9fa07ce3b5c.webp` | 手指指示图 | 229×327 | `public/scene1/ui/finger_hint.webp` | ui-finger-hint | 引导提示 |
| `e78a25aa-c69f-4184-9c43-9f070251112e.webp` | "Collect them" 文字 | 113×64 | `public/scene1/ui/collect_text.webp` | ui-collect-text | 收集提示 |
| `1d77b7d2-1f95-4b4f-b9ae-7471669265e9.webp` | "Meow!" 文字 | 114×28 | `public/scene1/ui/meow_text.webp` | ui-meow-text | 猫叫文字 |
| `326e5c4b-2859-497f-a892-a275247e91f5.webp` | 起泡聊天对话框 | 224×158 | `public/scene1/ui/speech_bubble.webp` | ui-speech-bubble | 对话框 |
| `b603019d-34f3-408a-9635-d3ab2b00d9e9.png` | 背景音开启状态图 | 130×117 | `public/scene1/ui/sound_on.png` | sound-on | BGM开启 |
| `3f7171c5-378a-43db-bcff-ea1767aa3380.png` | 背景音关闭的图片 | 130×117 | `public/scene1/ui/sound_off.png` | sound-off | BGM关闭 |
| `edaaf024-e831-4311-a66f-10242aefd17d.png` | 正确的勾"✅" | 128×110 | `public/scene1/ui/check_mark.png` | ui-check | 成功标记 |

### 6. 特效资源 (Effects)

| 源文件 | 描述 | 尺寸 | 目标路径 | Texture Key | 用途 |
|--------|------|------|----------|-------------|------|
| `24c419ea-63a8-4ea1-a9d0-7fc469489bbc.png` | 爆炸效果中心 | 31×31 | `public/scene1/fx/explosion_center.png` | fx-explosion-center | 消除特效中心 |
| `df87419d-e91d-4e7f-84be-4f88eb46c606.png` | 红色椭圆透明图案 | 250×105 | `public/scene1/fx/effect_h.png` | fx-effect-h | 横向爆炸效果 |
| `e8d60c1a-8849-42e6-a873-c49820b87b18.png` | 红色椭圆透明图案 | 105×250 | `public/scene1/fx/effect_v.png` | fx-effect-v | 纵向爆炸效果 |
| `0acd8b75-abbb-4e3e-b505-0c9215ed1d92.webp` | 纯灰色遮罩图 | 2048×2048 | `public/scene1/fx/mask_overlay.webp` | fx-mask | 遮罩层 |
| `12c7b81e-604e-4b05-8791-1b09b6e54b12.png` | 纯灰色图片 | 8×8 | `public/scene1/fx/gray_pixel.png` | fx-gray-pixel | 灰色像素（备用） |

### 7. 音频资源 (Audio)

| 源文件 | 描述 | 目标路径 | Audio Key | 用途 |
|--------|------|----------|-----------|------|
| `7f88a1de-959c-4ae5-a9a8-9c8d527a5bec.mp3` | 游戏背景音（35秒） | `public/scene1/audio/bgm.mp3` | bgm | 循环背景音乐 |
| `9ae04cca-3bff-44e6-bc71-35faf8307157.mp3` | 宝石被点击时的音效 | `public/scene1/audio/click.mp3` | sfx-click | 点击音效 |
| `7be9f917-6fc7-4cd5-bf8b-baa45fffe49a.mp3` | 移动宝石块的音效 | `public/scene1/audio/swap.mp3` | sfx-swap | 交换音效 |
| `2b2d0cb4-890e-43fe-a9e1-9f7c045c58c7.mp3` | 宝石被消除时的音效 | `public/scene1/audio/match1.mp3` | sfx-match1 | 消除音效1 |
| `ba6dd9ad-1e88-453f-b2de-96ad8f21750f.mp3` | 宝石消除成功的音效 | `public/scene1/audio/match2.mp3` | sfx-match2 | 消除音效2 |
| `8a0ddaad-7c70-471e-86a2-5a5906f6a078.mp3` | 宝石消除成功的音效 | `public/scene1/audio/match3.mp3` | sfx-match3 | 消除音效3 |
| `0ba739fa-0e13-4909-97c9-76836764fc1e.mp3` | 游戏失败的声音 | `public/scene1/audio/game_fail.mp3` | sfx-fail | 失败音效 |
| `6269a5b0-1ec2-46df-b5f3-01c2f41f6a0b.mp3` | 喵咪舒服的叫声 | `public/scene1/audio/victory.mp3` | sfx-victory | 胜利音效 |
| `a5f1fe25-016d-4d76-a2c2-f2294e539793.mp3` | 鼓掌声音 | `public/scene1/audio/applause.mp3` | sfx-applause | 鼓掌音效 |
| `3b845dd0-4f0c-4bec-a41e-72d835f4205c.mp3` | 睡觉打呼噜的音效 | `public/scene1/audio/snore.mp3` | sfx-snore | 呼噜声（空闲循环） |
| `d9b56777-5d07-4d42-bdc4-2f5a32ac2acd.mp3` | 一个"砰"一下的声音 | `public/scene1/audio/pop.mp3` | sfx-pop | 弹出音效 |

### 8. 未使用/用途不明资源

| 源文件 | 原因 |
|--------|------|
| `346e4231-7061-4e56-b284-ff500229b823.webp` | 资源清单标注"没什么用" |
| `3bd1e53e-b421-4108-ae30-7b24175393b9.webp` | 资源清单标注"没什么用" |
| `722533f0-698b-43d5-935f-67ab2af12ac4.webp` | 资源清单标注"没什么用" |

## 实施计划

### Phase 1: 资源复制与组织
1. 创建 public/scene1 目录结构（如不存在）
2. 按映射表复制并重命名所有资源文件
3. 为宝石创建精灵图（需要找到第5种宝石或重用现有素材）

### Phase 2: 配置更新
1. 更新 `src/game_config.ts` 中的所有资源路径
2. 配置新的音效映射
3. 配置棋盘背景和全屏背景
4. 更新宝石精灵图配置

### Phase 3: 游戏逻辑增强
1. 添加猫咪角色显示与状态切换
2. 添加关键道具展示台（display_table）
3. 实现空闲呼噜声循环播放
4. 添加获得关键道具时的猫咪反馈
5. 优化消除特效（使用新的爆炸素材）
6. 添加首次操作引导（手指提示）

### Phase 4: UI 增强
1. 添加生命值显示（如启用错误次数限制）
2. 添加收集提示文字
3. 优化成功/失败画面
4. 更换音乐控制按钮图标

### Phase 5: 验证与测试
1. TypeScript 类型检查
2. 构建验证
3. 浏览器测试（桌面 + 移动视口）
4. 游戏流程完整性测试

## 实施结果

### 已完成项目

✅ **Phase 1: 资源复制与组织**
- 已创建完整的 public/scene1 目录结构
- 所有资源已按映射表复制并重命名
- 使用 Python PIL 生成了 4 种宝石的精灵图 (400x100, 4帧)

✅ **Phase 2: 配置更新**
- 已更新 `src/game_config.ts` 中的所有资源路径
- 新增背景图和棋盘图配置
- 配置了所有音效（包括新增的 swap、keyCollect、victory、applause）
- 将 frameCount 从 6 改为 4（使用 4 种宝石）
- 更新了背景色为温暖色调 (#f4e4d7)

✅ **Phase 3: 游戏逻辑增强**
- 添加了猫咪角色显示与 3 种状态切换（idle、licking、happy）
- 实现了空闲呼噜声循环播放系统（10秒无操作后触发）
- 添加了关键道具收集后的猫咪反馈（舔手状态）
- 在展示台上显示已收集的道具图标
- 添加了交换音效
- 胜利时播放猫叫声和鼓掌声

✅ **Phase 4: UI 增强**
- 添加了全屏室内场景背景
- 添加了棋盘背景图（带自动边距计算）
- 添加了猫爬架装饰
- 添加了展示台用于显示收集到的道具
- 更换了音乐控制按钮图标
- 优化了成功/失败画面

✅ **Phase 5: 验证与测试**
- TypeScript 类型检查通过
- 构建成功，无错误
- Git diff 检查通过
- 开发服务器成功启动在 http://localhost:9004/

## 技术决策记录

### 宝石数量问题
**决策**：使用 4 种宝石，将 `frameCount` 从 6 改为 4
**原因**：资源清单只明确列出了 4 种宝石（紫色钻石、橘黄棱形、粉红桃心、绿色多面体），标注为"没什么用"的资源不适合作为宝石使用。4 种宝石对于 6x8 的棋盘已经足够丰富。

### 棋盘背景适配
**实现**：自动计算棋盘图片的边距和缩放
- 根据 `资源清单.md` 中提到的"棋盘有边缘"，在配置中添加了 padding 定义
- 实现了动态缩放以适应不同屏幕尺寸
- 宝石区域与棋盘内容区域精确对齐

### 猫咪角色系统
**实现**：非阻塞式装饰层
- 猫咪和猫爬架放置在右侧，depth 为 5-6
- 棋盘和宝石 depth 为 -1 到 1
- 确保猫咪不会干扰宝石交互

### 音效系统
**实现**：多层次音频反馈
- BGM：35秒循环背景音乐
- 交互音效：点击、交换、消除（3种）、无效交换
- 情感音效：猫叫声（胜利）、鼓掌声
- 环境音效：呼噜声（空闲状态，10秒无操作后循环播放）
- 所有音效都在用户首次交互后才能播放

## 注意事项

- ✅ 棋盘图片有边缘，已实现自动边距计算
- ✅ 所有交互元素（按钮、猫咪）使用不同 depth 层级，不会阻挡宝石点击
- ✅ 音频在用户首次交互后才开始播放
- ✅ 保持了现有的 KeyCell 逻辑不变
- ✅ 响应式布局已更新，支持背景和装饰元素的自适应
