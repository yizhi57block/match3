# Scene1 资源映射与浏览器运行清单

## 事实来源与验证范围

- 首要事实来源：`resource/scene1/资源清单.md`（用途、尺寸和建议）。
- 视觉基准：`resource/scene1/design_1.png`（692×1287）和 `resource/scene1/design_2.png`（827×1295）。设计稿只作为布局参考，不进入运行时。
- 2026-08-12 已用 `file`、`sips`、`ffprobe` 和逐图查看核对：图片均为浏览器可直接解码的 PNG/WebP；11 条音频均为 24 kHz 双声道 MP3，时长从 0.168 秒到 35.976 秒。资源包中没有需要 Phaser 直接加载的 PVR/PKM/ASTC、PLIST、图集 JSON 或 `effect.bin`。
- 运行时副本统一放在 `public/scene1/`。源 UUID 文件和 `资源清单.md` 保持原样。

## 运行时图片映射

| 源文件（`resource/scene1/`） | 清单描述 | 运行时文件 / texture key | 游戏用途 |
| --- | --- | --- | --- |
| `263f0f51-1d02-46b9-9dad-33d4ec4f9877.webp` | 室内场景背景，2048×2048 | `public/scene1/images/background.webp` / `scene1-background` | 全屏 cover 背景，等比缩放并居中裁切 |
| `8954b0ad-5ecc-482f-9b37-b0da70eb9368.webp` | 宝石棋盘，562×754 | `public/scene1/images/board.webp` / `scene1-board` | 与 6×8 逻辑棋盘边界精确同宽高 |
| `019f3ee2-75da-4520-951d-b057141ba5bb.webp` | 紫色钻石宝石，79×80 | `public/scene1/images/gem-purple.webp` / `scene1-gem-purple` | 宝石类型 0；独立纹理，不 tint |
| `05b3ca95-093c-4839-b32e-97538e85e94d.webp` | 橘黄色棱形宝石，77×82 | `public/scene1/images/gem-orange.webp` / `scene1-gem-orange` | 宝石类型 1；独立纹理，不 tint |
| `0da13f75-8b48-49a3-8e6a-d76c22877a1b.webp` | 粉红桃心宝石，78×78 | `public/scene1/images/gem-heart.webp` / `scene1-gem-heart` | 宝石类型 2；独立纹理，不 tint |
| `c5c5fb3d-c624-42f9-965a-85427a725f9b.webp` | 绿色多面体宝石，79×81 | `public/scene1/images/gem-green.webp` / `scene1-gem-green` | 宝石类型 3；独立纹理，不 tint |
| `92af201e-3577-4362-8e51-e68b841a0227.webp` | 老鼠玩具，104×88 | `public/scene1/images/key-mouse.webp` / `scene1-key-mouse` | KeyCell 1；落到底部后进入展示台 |
| `99b361cc-744a-42c1-b173-7cda9bb8e1f1.webp` | 猫食碗，105×81 | `public/scene1/images/key-bowl.webp` / `scene1-key-bowl` | KeyCell 2；落到底部后进入展示台 |
| `c0a40a90-2cd1-4fc1-97e9-c56833b2cfbc.webp` | 鱼，104×85 | `public/scene1/images/key-fish.webp` / `scene1-key-fish` | KeyCell 3；落到底部后进入展示台 |
| `1ecd4a73-c4ee-46f8-bee3-d00b164a28db.webp` | 场景猫咪状态，244×314 | `public/scene1/images/cat-idle-a.webp` / `scene1-cat-idle-a` | 默认/观察状态 |
| `2e7494ea-f996-4ba7-9a92-63f96106fe68.webp` | 场景猫咪状态，282×352 | `public/scene1/images/cat-idle-b.webp` / `scene1-cat-idle-b` | 空闲呼噜状态 |
| `d567f08f-0163-432e-ac85-3d5adc3f8cfa.webp` | 舔手猫，234×285 | `public/scene1/images/cat-key.webp` / `scene1-cat-key` | 获得关键物反馈 |
| `6e5a46c6-7f99-42bf-9685-00578e1cd586.webp` | 微笑猫，243×290 | `public/scene1/images/cat-win.webp` / `scene1-cat-win` | 胜利状态 |
| `56cad95e-ae61-452d-87a9-61d0dbfea7b5.webp` | 猫爬架，440×943 | `public/scene1/images/cat-tree.webp` / `scene1-cat-tree` | 宽屏侧边角色舞台；窄屏隐藏以保证棋盘命中区 |
| `79f50229-a953-476c-b6c5-ad89912a5965.webp` | 机会数长条，431×132 | `public/scene1/images/life-panel.webp` / `scene1-life-panel` | 顶部生命/错误次数面板 |
| `cfa73666-96af-4d70-b6db-02491ac9fe08.webp` | 完整心形机会，85×81 | `public/scene1/images/heart.webp` / `scene1-heart` | 尚可用的错误机会 |
| `5c00d521-e403-40f4-a6c4-5761e836e3f5.webp` | 破碎心形，88×81 | `public/scene1/images/heart-broken.webp` / `scene1-heart-broken` | 无效交换后的机会损失反馈 |
| `cf42512d-c811-4f99-a6fc-9f428df0a1a8.webp` | 三垫展示台，591×166 | `public/scene1/images/key-stand.webp` / `scene1-key-stand` | 底部已收集关键物展示台 |
| `e78a25aa-c69f-4184-9c43-9f070251112e.webp` | “Collect them”文字，113×64 | `public/scene1/images/collect-them.webp` / `scene1-collect-them` | 关键物目标提示 |
| `85afb934-bb38-47d5-a9b5-a9fa07ce3b5c.webp` | 手指引导，229×327 | `public/scene1/images/hand-guide.webp` / `scene1-hand-guide` | 首局空闲时指向一组真实可用交换，并在操作后隐藏 |
| `326e5c4b-2859-497f-a892-a275247e91f5.webp` | 起泡聊天框，224×158 | `public/scene1/images/speech-bubble.webp` / `scene1-speech-bubble` | 错误交换时猫咪短反馈 |
| `1d77b7d2-1f95-4b4f-b9ae-7471669265e9.webp` | “Meow!”文字，114×28 | `public/scene1/images/meow.webp` / `scene1-meow` | 聊天气泡内容 |
| `24c419ea-63a8-4ea1-a9d0-7fc469489bbc.png` | 爆炸中心，31×31 | `public/scene1/images/boom.png` / `scene1-boom` | 每个消除坐标的放大/淡出中心效果 |
| `edaaf024-e831-4311-a66f-10242aefd17d.png` | 绿色勾，128×110 | `public/scene1/images/check.png` / `scene1-check` | 展示台已收集标记 |
| `3f7171c5-378a-43db-bcff-ea1767aa3380.png` | 背景音关闭，130×117 | `public/scene1/images/music-off.png` / `scene1-music-off` | 音频关闭状态按钮 |
| `b603019d-34f3-408a-9635-d3ab2b00d9e9.png` | 背景音开启，130×117 | `public/scene1/images/music-on.png` / `scene1-music-on` | 音频开启状态按钮 |
| `0acd8b75-abbb-4e3e-b505-0c9215ed1d92.webp` | 半透明灰遮罩，2048×2048 | `public/scene1/images/outcome-mask.webp` / `scene1-outcome-mask` | 胜负结算时的全屏等比遮罩 |
| `4504d131-809b-4261-af29-6dea85c9fd70.webp` | 失败画面，657×657 | `public/scene1/images/fail.webp` / `scene1-fail` | 失败结算主图 |
| `99c81601-7660-463a-b8da-7f2bf5cf7c01.webp` | 胜利画面，639×661 | `public/scene1/images/success.webp` / `scene1-success` | 三个关键物全部收集后的结算主图 |

## 运行时音频映射

| 源文件 | 清单描述 / 核对时长 | 运行时文件 / audio key | 使用位置 |
| --- | --- | --- | --- |
| `7f88a1de-959c-4ae5-a9a8-9c8d527a5bec.mp3` | 背景音乐 / 35.976 s | `public/scene1/audio/bgm.mp3` / `scene1-bgm` | 首次用户交互后循环播放 |
| `9ae04cca-3bff-44e6-bc71-35faf8307157.mp3` | 点击 / 0.480 s | `public/scene1/audio/click.mp3` / `scene1-click` | 选中宝石 |
| `7be9f917-6fc7-4cd5-bf8b-baa45fffe49a.mp3` | 移动宝石 / 0.352 s | `public/scene1/audio/swap.mp3` / `scene1-swap` | 相邻交换开始 |
| `2b2d0cb4-890e-43fe-a9e1-9f7c045c58c7.mp3` | 宝石消除 / 2.304 s | `public/scene1/audio/match.mp3` / `scene1-match` | 三消解析 |
| `8a0ddaad-7c70-471e-86a2-5a5906f6a078.mp3` | 消除成功 / 1.752 s | `public/scene1/audio/match-big.mp3` / `scene1-match-big` | 四个以上同时消除 |
| `ba6dd9ad-1e88-453f-b2de-96ad8f21750f.mp3` | 宝石消除 / 2.016 s | `public/scene1/audio/cascade.mp3` / `scene1-cascade` | 第二段及以后连锁 |
| `d9b56777-5d07-4d42-bdc4-2f5a32ac2acd.mp3` | “砰” / 0.168 s | `public/scene1/audio/boom.mp3` / `scene1-boom-sound` | 爆炸中心出现时（每轮一次） |
| `0ba739fa-0e13-4909-97c9-76836764fc1e.mp3` | 失败 / 3.216 s | `public/scene1/audio/fail.mp3` / `scene1-fail-sound` | 生命耗尽结算 |
| `6269a5b0-1ec2-46df-b5f3-01c2f41f6a0b.mp3` | 舒服猫叫 / 2.304 s | `public/scene1/audio/success-meow.mp3` / `scene1-success-meow` | 胜利猫咪反馈 |
| `a5f1fe25-016d-4d76-a2c2-f2294e539793.mp3` | 鼓掌 / 3.576 s | `public/scene1/audio/success-clap.mp3` / `scene1-success-clap` | 胜利结算 |
| `3b845dd0-4f0c-4bec-a41e-72d835f4205c.mp3` | 呼噜 / 4.392 s | `public/scene1/audio/purr.mp3` / `scene1-purr` | 首次交互后的空闲循环；恢复操作即停止 |

所有音频调用都经过“用户已交互、音频未关闭、缓存存在”检查；加载失败只关闭对应声音，不阻断棋盘状态机。

## 未采用的输入资源

| 源文件 | 原因 |
| --- | --- |
| `346e4231-7061-4e56-b284-ff500229b823.webp`、`3bd1e53e-b421-4108-ae30-7b24175393b9.webp`、`722533f0-698b-43d5-935f-67ab2af12ac4.webp` | 清单明确标注“没什么用”，实图接近空白；不为凑素材制造假功能。 |
| `df87419d-e91d-4e7f-84be-4f88eb46c606.png`、`e8d60c1a-8849-42e6-a873-c49820b87b18.png` | 红色横/竖遮罩用途仅为猜测，且会覆盖操作区域；选中态改用可配置的 Phaser 描边环。 |
| `12c7b81e-604e-4b05-8791-1b09b6e54b12.png` | 8×8 纯灰图与 2048×2048 半透明结算遮罩作用重复，后者更符合清单描述。 |
| `design_1.png`、`design_2.png` | 仅作为 UI 构图基准，不作为游戏背景或运行时截图。 |

## 原创本地补充

没有生成或下载额外位图、音频和图标。下列补充视觉由 Phaser 在运行时使用本地代码绘制：选中宝石描边环、分数与连击文字、“Collect them”浅色对比铭牌、窄屏安全布局、结算“再玩一次”按钮。它们的颜色、尺寸、层级和动画参数集中在 `src/game_config.ts`。
