# Shift Scheduler GAS

## 概要
Google Apps Script (GAS) と Google スプレッドシートを用いて、学園祭などのイベント向けシフトを自動的に割り当てるシステムです。利用者が定義したルールやメンバーの希望・NG 情報を考慮し、公平性と多様性を担保したシフト表を生成します。

## プロジェクト構成
```
shift-scheduler-gas
├── src
│   ├── main.gs
│   ├── services
│   │   └── assignmentService.gs
│   ├── repositories
│   │   ├── availabilityRepository.gs
│   │   ├── memberRepository.gs
│   │   └── timeSlotRepository.gs
│   └── utils
│       ├── scoringUtils.gs
│       └── sheetUtils.gs
├── appsscript.json
└── README.md
```

## ファイル概要

- `src/main.gs`: メニュー追加とエントリーポイントを提供し、シフト割り当て処理を起動します。
- `src/services/assignmentService.gs`: シフト割り当てロジック本体。候補者スコアリングやペア履歴管理、結果の構築を担当します。
- `src/repositories/availabilityRepository.gs`: `availability_sheet` からメンバーごとの NG 時間帯を取得します。
- `src/repositories/memberRepository.gs`: `member_master` からメンバー情報（ID・氏名・学年）を読み込みます。
- `src/repositories/timeSlotRepository.gs`: `time_slot_master` の時間枠を Date オブジェクト付きで取得します。
- `src/utils/scoringUtils.gs`: ペア回避や役割未経験、学年多様性、公平性などの指標に基づき候補者をスコアリングします。
- `src/utils/sheetUtils.gs`: スプレッドシートとの入出力や日付・時刻変換、個人別シートの更新などの共通処理を提供します。
- `appsscript.json`: プロジェクト設定。タイムゾーンやランタイムバージョンなどを定義します。

## セットアップ手順
1. Google スプレッドシート上で `member_master`、`availability_sheet`、`time_slot_master`、`shift_result_overall`、`shift_result_individual` シートを準備します。
2. 本プロジェクトを Apps Script エディタに取り込みます。
3. Apps Script エディタで `runShiftAssignment` を実行するか、スプレッドシートのメニュー「Shift Scheduler」→「シフト自動割り当て」を実行します。

## 使い方
- `member_master` にメンバー ID・氏名・学年を入力します。
- `availability_sheet` に各メンバーの NG 期間（開始・終了）を登録します。
- `time_slot_master` に割り当て対象の日時枠を登録します。
- 実行後、`shift_result_overall` に役割別のシフト結果が出力され、`shift_result_individual` にはプルダウンで選択したメンバーの予定が自動表示されます。

## 補足
- スコアリングはペア回避を最優先し、役割未経験・学年の多様性・勤務時間の偏りを順に考慮します。
- NG 期間や連続勤務（同一メンバーの連続時間枠）は絶対条件として割り当て対象から除外されます。
- 個別シートは `shift_result_overall` の結果を参照して動的に更新されます。