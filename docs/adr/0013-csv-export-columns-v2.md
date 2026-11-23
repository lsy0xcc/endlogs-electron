# ADR-0013：CSV 导出列结构——camelCase 表头，可读列在前、原始码在后

- 状态：已接受（2026-11-23，用户决策；同日二次修订：表头 camelCase 化 + 新增 `isoTime` 权威时间列。原中文十列 v2 从未随代码发布（脚手架未建），直接在本文修订，不留版本分叉）
- 修订：ADR-0004 / ADR-0009 中「列结构沿用旧项目 8 列」的决策；ADR-0009 的时间列显式偏移方案（由 `isoTime` 列取代）

## 决策

导出固定 11 列，表头统一英文 camelCase；前 6 列便于人读，后 5 列（`isoTime` + 原始码）为机器权威值：

```csv
time,resourceType,reason,changeType,amount,balanceAfter,isoTime,currencyCode,reasonCode,changeTypeCode,seqId
```

- `time`：`YYYY-MM-DD HH:MM:SS`，按系统时区格式化、无偏移（ADR-0012），仅人读；**导入不解析该列**
- `isoTime`：ISO 8601 UTC（`YYYY-MM-DDTHH:MM:SSZ`，以 `Z` 结尾），**导入的权威时间源**——绝对时刻自描述，跨时区机器导出字面值恒定
- `amount` 带符号（获取 `+100` / 消耗 `-50`）；`changeType` 仍为「获取/消耗」文字
- 导入以**码列**（currencyCode / reasonCode / changeTypeCode / seqId）+ `isoTime` 为准；resourceType / reason / time 三列仅参考不导入
- 导入按表头识别格式：camelCase 11 列 vs 旧项目中文八列；无法识别则整体拒绝
- CSV 解析与生成统一使用 **papaparse** 库（主进程），不自写解析器

## 理由与后果

- 人读 CSV 时先看前几列（时间/资源/原因/数量）；机器往返以 `isoTime` + 码列为权威，不依赖码表版本与时区
- ADR-0009 的「显式偏移」职责被拆分：对人可读（与游戏内显示一致、无需心算）由无偏移的 `time` 列承担；自描述与跨时区无损由 `isoTime` 承担
- `time` 列字面值随导出机器时区而变——正因如此导入不解析它，时间只认 `isoTime`
- 与旧 8 列格式不再兼容 → 导入侧同时支持两种格式（按表头分支，成本可控）
- 行内 amount 符号与 changeTypeCode 冲突 → 视为损坏数据，整行拒绝
