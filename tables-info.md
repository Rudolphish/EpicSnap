# 🗄️ DB スキーマ定義：スクショ共有アプリ（保存数制限＋共有アルバム型）

## 1️⃣ users テーブル

| カラム名      | 型        | 説明                            |
| ------------- | --------- | ------------------------------- |
| id            | UUID      | Supabase Auth の UID と一致     |
| username      | TEXT      | 表示名（任意）                  |
| is_subscribed | BOOLEAN   | 課金状態（true = 有料）         |
| created_at    | TIMESTAMP | 登録日時                        |
| is_admin      | BOOLEAN   | システム管理者（true = 管理者） |

---

## 2️⃣ screenshots テーブル

| カラム名   | 型        | 説明                    |
| ---------- | --------- | ----------------------- |
| id         | UUID      | スクショ ID             |
| user_id    | UUID      | 投稿者（Auth UID）      |
| album_id   | UUID      | 所属アルバム（任意）    |
| image_url  | TEXT      | Supabase Storage の URL |
| file_name  | TEXT      | ファイル名              |
| created_at | TIMESTAMP | 投稿日時                |

---

## 3️⃣ albums テーブル

| カラム名   | 型        | 説明               |
| ---------- | --------- | ------------------ |
| id         | UUID      | アルバム ID        |
| owner_id   | UUID      | 作成者（Auth UID） |
| name       | TEXT      | アルバム名         |
| is_shared  | BOOLEAN   | 共有 ON/OFF        |
| created_at | TIMESTAMP | 作成日時           |

---

## 4️⃣ album_members テーブル

| カラム名  | 型        | 説明                     |
| --------- | --------- | ------------------------ |
| id        | UUID      | メンバー ID              |
| album_id  | UUID      | 対象アルバム             |
| user_id   | UUID      | 参加ユーザー（Auth UID） |
| joined_at | TIMESTAMP | 参加日時                 |

---

## 5️⃣ subscriptions テーブル（課金状態）

| カラム名           | 型        | 説明             |
| ------------------ | --------- | ---------------- |
| id                 | UUID      | サブスク ID      |
| user_id            | UUID      | 対象ユーザー     |
| stripe_customer_id | TEXT      | Stripe の顧客 ID |
| plan               | TEXT      | プラン名（任意） |
| is_active          | BOOLEAN   | 課金状態         |
| updated_at         | TIMESTAMP | 最終更新日時     |

---

## 🧠 補足

- 各テーブルは Supabase Auth の `auth.uid()` を基準にアクセス制御（RLS）を設計済み
- `screenshots` と `albums` は `user_id` を持ち、個人と共有の両方に対応
- `subscriptions` は Stripe 連携を前提に設計（Webhook 更新想定）
