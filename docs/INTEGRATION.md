# 教材・動画への組み込み

## 推奨フロー

1. 教材・動画の原稿を作る。
2. `npm run build` で統合辞書 `dist/lexicon.json` を生成する。
3. 原稿に対して、長い語から順に読みを適用する。
4. 未登録の固有名詞・漢字語は「読み未確認」として抽出する。
5. 確認後、この正本へ追加する。
6. 完成物には可能なら `ttsQ` / `ttsA` / `ttsText` として読み上げ専用文字列を固定保存する。

## 重要

- 実行時にGitHubへアクセスする設計にはしない。
- 辞書は制作・ビルド時に取り込む。
- TTSエンジンに漢字の読みを推測させない。
- 同一表記に複数の読みがある語は `data/contextual-readings.json` で文脈管理する。

## JavaScript例

```js
import lexicon from './dist/lexicon.json' with { type: 'json' };
import { normalizeForTTS } from './scripts/normalize.mjs';

const spoken = normalizeForTTS('富士山と英虞湾', lexicon.entries);
// ふじさんとあごわん
```

## 教材データ例

```json
{
  "q": "日本で最も高い山は何ですか。",
  "a": "富士山",
  "ttsQ": "にほんで もっとも たかい やまは なんですか。",
  "ttsA": "ふじさん"
}
```
