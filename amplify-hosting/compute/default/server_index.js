"use strict";
// src/index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 3001;
const axios = require('axios');
const ODATA_BASE_URL = "https://ims-api-v300-dev.azurewebsites.net/";
// const ODATA_BASE_URL = "https://ims-api-v300-dev-staging.azurewebsites.net/";
// const EMM_LOGIN_URL = "https://emm.jp.sharp/api/auth/login";
const EMM_BASE_URL = "https://st-emm.jp.sharp/api";
// データベース設定
// const pool = new Pool({
//   host: "localhost",
//   user: "remohab",
//   password: "",
//   database: "remohab",
//   port: 5432,
// });
// データベース設定
const pool = new Pool({
    host: "localhost",
    user: "",
    password: "",
    database: "dock",
    port: 5432,
});
const cors = require("cors");
app.use(cors());
// JSON形式のリクエストボディを解析するためのミドルウェア
app.use(express.json());
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// NTT OAuthトークン取得用の関数
function getOAuthToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.post('https://api.ntt.com/v1/oauth/accesstokens', {
                grantType: 'client_credentials',
                clientId: 'sBS5654tYonsao358AcmY498Kf1W82Mp',
                clientSecret: '9I2t8fB6uCRL8y2i'
            }, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching OAuth token:', error);
            throw new Error('Failed to retrieve OAuth token');
        }
    });
}
// アクセストークン取得
app.get('/api/ocn/token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        res.json({ accessToken: tokenData.accessToken });
    }
    catch (error) {
        res.status(500).send('Internal Server Error');
    }
}));
// お問い合わせステータス取得
app.get("/api/contactUs/statuses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        status_code AS id,
        status_name AS name,
        status_color AS color
      FROM contact_us_status
      WHERE 1=1
      ORDER BY status_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// OData 契約・テナント・施設の作成・認証なし
app.post("/api/odata/post/noauth/group/tenant", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postData = req.body;
        const url = `${ODATA_BASE_URL}Tenants/Initialize`;
        const odataResponse = yield axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const dataResult = odataResponse.data;
        res.json(dataResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// OData 契約・テナント・施設の作成・認証あり
app.post("/api/odata/post/group/tenant", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    try {
        const postData = req.body;
        const url = `${ODATA_BASE_URL}Tenants/Initialize`;
        const odataResponse = yield axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken
            }
        });
        const dataResult = odataResponse.data;
        res.json(dataResult);
    }
    catch (err) {
        if (err.response) {
            console.error("Error response body:", err.response.data);
            res.status(err.response.status).send(err.response.data);
        }
        else {
            console.error("Error with no response:", err.message);
            res.status(500).send("Server Error");
        }
    }
}));
// OData 取得・認証なし
app.get("/api/odata/noAuth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // クライアントからのクエリパラメータ（odataQuery）を取得
        const { odataQuery } = req.query;
        // 外部のODataサービスにリクエストを送る
        const url = `${ODATA_BASE_URL}${odataQuery}`;
        const odataResponse = yield axios.get(url);
        const dataResult = odataResponse.data;
        // レスポンスをクライアントに返す
        res.json(dataResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// Debug: OData 取得・認証あり テストではステージング用のURLを使用
app.get('/api/odata/prefectures', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    const url = "https://ims-api-v300-dev-staging.azurewebsites.net/Prefectures?$orderby=displayOrder";
    const options = {
        method: "GET",
        headers: {
            "Authorization": accessToken
        }
    };
    try {
        const response = yield fetch(url, options);
        const data = yield response.json();
        res.json(data);
    }
    catch (err) {
        if (err.response) {
            console.error("Error response body:", err.response.data);
            res.status(err.response.status).send(err.response.data);
        }
        else {
            console.error("Error with no response:", err.message);
            res.status(500).send("Server Error");
        }
    }
}));
// OData 取得・認証あり
app.get("/api/odata", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    const options = {
        method: "GET",
        headers: {
            "Authorization": accessToken
        }
    };
    // クライアントからのクエリパラメータ（odataQuery）を取得
    const { odataQuery } = req.query;
    const url = `${ODATA_BASE_URL}${odataQuery}`;
    console.log("URL: " + url);
    // try {
    //   const response = await fetch(url, options);
    //   const data = await response.json();
    //   res.json(data);
    // } catch (err) {
    //   if (err.response) {
    //     console.error("Error response body:", err.response.data);
    //     res.status(err.response.status).send(err.response.data);
    //   } else {
    //     console.error("Error with no response:", err.message);
    //     res.status(500).send("Server Error");
    //   }
    // }
    try {
        const response = yield fetch(url, options);
        // レスポンスが正常かどうかを確認
        if (!response.ok) {
            const errorText = yield response.text();
            console.error("Error response body:", errorText);
            res.status(response.status).send(errorText);
            return;
        }
        // レスポンスがJSONであることを確認しつつパース
        const data = yield response.json();
        res.json(data);
    }
    catch (err) {
        // fetch APIでは、err.responseは存在しないため、代わりにresponse.okのチェックを行う
        console.error("Fetch error:", err.message);
        res.status(500).send("Server Error");
    }
}));
// OData 新規レコード作成
app.post("/api/odata/post", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    try {
        const entitySet = req.query.entitySet;
        const postData = req.body;
        const url = `${ODATA_BASE_URL}${entitySet}`;
        const odataResponse = yield axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken
            }
        });
        const dataResult = odataResponse.data;
        res.json(dataResult);
    }
    catch (err) {
        console.error('Error posting data:', err);
        if (err.response) {
            console.error('Response body:', err.response.data);
        }
        res.status(500).send("Server Error");
    }
}));
// OData 部分的な更新
app.patch("/api/odata/patch", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    try {
        const entitySet = req.query.entitySet;
        const entityId = req.query.entityId;
        const patchData = req.body;
        const url = `${ODATA_BASE_URL}${entitySet}(${entityId})`;
        console.log("URL: " + url);
        console.log("PATCH Data:", JSON.stringify(patchData));
        const odataResponse = yield axios.patch(url, patchData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken
            }
        });
        const dataResult = odataResponse.data;
        res.json(dataResult);
    }
    catch (err) {
        if (err.response) {
            console.error("Error response body:", err.response.data);
            res.status(err.response.status).send(err.response.data);
        }
        else {
            console.error("Error with no response:", err.message);
            res.status(500).send("Server Error");
        }
    }
}));
// OData 全体的な更新
app.put("/api/odata/put", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    try {
        const entitySet = req.query.entitySet;
        const putData = req.body;
        const entityId = req.body.id;
        const url = `${ODATA_BASE_URL}${entitySet}(${entityId})`;
        const odataResponse = yield axios.put(url, putData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken
            }
        });
        const dataResult = odataResponse.data;
        res.json(dataResult);
    }
    catch (err) {
        if (err.response) {
            console.error("Error response body:", err.response.data);
            res.status(err.response.status).send(err.response.data);
        }
        else {
            console.error("Error with no response:", err.message);
            res.status(500).send("Server Error");
        }
    }
}));
// OData 削除
app.delete("/api/odata/delete", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    try {
        const entitySet = req.query.entitySet;
        const entityId = req.query.id;
        const url = `${ODATA_BASE_URL}${entitySet}(${entityId})`;
        const response = yield axios.delete(url, {
            headers: {
                'Authorization': accessToken,
                'Content-Type': 'application/json'
            }
        });
        const dataResult = response.data;
        res.json(dataResult);
    }
    catch (err) {
        if (err.response) {
            console.error("Error response body:", err.response.data);
            res.status(err.response.status).send(err.response.data);
        }
        else {
            console.error("Error with no response:", err.message);
            res.status(500).send("Server Error");
        }
    }
}));
// OData ステージング取得
app.get("/api/odata/staging", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // クライアントからのクエリパラメータ（odataQuery）を取得
        const { odataQuery } = req.query;
        // 外部のODataサービスにリクエストを送る
        const URI = `${ODATA_STAGING_URL}${odataQuery}`;
        const odataResponse = yield axios.get(URI);
        const dataResult = odataResponse.data;
        // レスポンスをクライアントに返す
        res.json(dataResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// OData ステージング削除
app.delete("/api/odata/staging/delete", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entitySet = req.query.entitySet;
        const entityId = req.query.id;
        const URI = `${ODATA_STAGING_URL}${entitySet}(${entityId})`;
        const response = yield axios.delete(URI);
        const dataResult = response.data;
        res.json(dataResult);
    }
    catch (err) {
        // AxiosErrorから重要な情報だけを取得
        if (axios.isAxiosError(err)) {
            const errorResponse = err.response;
            console.error("Error status:", errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.status); // エラーステータスコード
            console.error("Error message:", errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.data); // エラーメッセージ
            res.status((errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.status) || 500).send("Server Error: " + (errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.data));
        }
        else {
            // Axios以外のエラーの場合
            console.error("Non-Axios error:", err.message);
            res.status(500).send("Server Error: " + err.message);
        }
    }
}));
// 回線一覧取得
app.get('/api/ocn/lines', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        const page = req.query.page;
        const contractId = req.query.contractId;
        const response = yield axios.get(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/pages/1/lines`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// 回線のデータ利用量等の取得
app.get('/api/ocn/line/traffics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        const contractId = req.query.contractId;
        const lineNo = req.query.lineNo;
        const response = yield axios.get(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/lines/${lineNo}/traffic`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// 契約番号配下の容量シェア中の回線一覧取得
app.get('/api/ocn/dataShare', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        const contractId = req.query.contractId;
        const response = yield axios.get(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/dataShare`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// 回線番号の容量シェア情報取得
app.get('/api/ocn/shared/line', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        const contractId = req.query.contractId;
        const lineNo = req.query.line;
        const response = yield axios.get(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/lines/${lineNo}/dataShare/traffic`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// 回線運用情報取得
app.get('/api/ocn/line', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield getOAuthToken();
        const contractId = req.query.contractId;
        const lineNo = req.query.line;
        const response = yield axios.get(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/lines/${lineNo}/traffic`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// サスペンデッド有効化（使用中断）
app.put('/api/ocn/suspended', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contractId, line } = req.body;
        const tokenData = yield getOAuthToken();
        const response = yield axios.put(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/lines/${line}/suspend`, {}, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// サスペンデッド無効化（使用再開）
app.delete('/api/ocn/unSuspended', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contractId, line } = req.body;
        const tokenData = yield getOAuthToken();
        const response = yield axios.delete(`https://jp.api.ntt.com/v1/bocnmf/contracts/${contractId}/lines/${line}/suspend`, {
            headers: {
                'Authorization': `Bearer ${tokenData.accessToken}`,
            }
        });
        res.json(response.data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// // 郵便番号から住所を取得
// app.get('/api/postalcode', async (req, res) => {
//   try {
//     const { postalCode } = req.query;
//     const URI = `https://postcode.teraren.com/postcodes/${postalCode}.json`
//     const response = await axios.get(URI);
//     res.json(response.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });
// システム種類取得
app.get("/api/apps", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        app_code AS id,
        app_name AS name,
        app_color AS color
      FROM apps
      WHERE 1=1
      ORDER BY app_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// メッセージ全取得
app.get("/api/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        message_code,
        content, 
        faq_code
      FROM messages
      WHERE 1=1`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 都道府県取得
app.get("/api/prefectures", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        prefecture_id AS id,
        prefecture_name AS name
      FROM prefectures
      ORDER BY prefecture_id`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 都道府県配下のテナント取得
app.get("/api/prefecture/tenants", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prefId = parseInt(req.query.prefId);
        const params = [prefId];
        const dataQuery = `
      SELECT
        tenant_id AS id,
        tenant_name AS name
      FROM tenants
      WHERE 1=1
        AND prefecture_id = $1
      ORDER BY tenant_id`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, params.filter(p => p !== undefined));
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// リハビリステータス取得
app.get("/api/rehabilitation/statuses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        reha_status_code AS id,
        reha_status_name AS name
      FROM reha_status
      WHERE 1=1
      ORDER BY reha_status_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お問い合わせ番号によるリハビリ取得
app.get("/api/contactNo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contactNo = req.query.contactNo;
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const contactNoPattern = `%${contactNo}`;
        // 総件数取得用クエリ
        const countParams = [contactNoPattern];
        const countQuery = `
      SELECT COUNT(r.reha_no) AS count
      FROM patients p
      INNER JOIN tenants t ON p.tenant_id = t.tenant_id
      INNER JOIN rehabilitations r ON p.patient_id = r.patient_id
      INNER JOIN reha_status rs ON r.reha_status_code = rs.reha_status_code
      WHERE r.reha_no::TEXT LIKE $1`;
        // データ取得用クエリ
        const dataParams = [limit, offset, contactNoPattern];
        let dataQuery = `
    SELECT
      pf.prefecture_Id AS prefectureId,
      pf.prefecture_name,
      p.tenant_id,
      t.tenant_name,
      p.patient_id,
      p.patient_full_name,
      p.patient_kana_name,
      p.patient_code_name,
      r.reha_no,
      r.reha_start_time,
      r.reha_end_time,
      r.err_code,
      rs.reha_status_code,
      rs.reha_status_name,
      rs.reha_status_color
    FROM patients p
    INNER JOIN tenants t ON p.tenant_id = t.tenant_id
    INNER JOIN rehabilitations r ON p.patient_id = r.patient_id
    INNER JOIN reha_status rs ON r.reha_status_code = rs.reha_status_code
    INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
    WHERE r.reha_no::TEXT LIKE $3
    ORDER BY p.patient_id, r.reha_start_time DESC`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParams);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// リハビリ一覧取得
app.get("/api/rehabilitations", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prefId = parseInt(req.query.prefId);
        const tenantId = parseInt(req.query.tenantId);
        const statusCode = parseInt(req.query.statusCode);
        const startDate = req.query.startDate || "1970-01-01 00:00:00";
        const endDate = req.query.endDate || "9999-12-31 23:59:59";
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        // 総件数取得用クエリ
        const countParams = [prefId, tenantId, statusCode, startDate, endDate];
        const countQuery = `
      SELECT COUNT(reha_no) AS count
      FROM patients p
      INNER JOIN tenants t ON p.tenant_id = t.tenant_id
      INNER JOIN rehabilitations r ON p.patient_id = r.patient_id
      INNER JOIN reha_status rs ON r.reha_status_code = rs.reha_status_code
      WHERE t.prefecture_id = $1
        AND p.tenant_id = $2
        AND r.reha_status_code = $3
        AND r.reha_start_time >= $4
        AND r.reha_end_time <= $5;`;
        // データ取得用クエリ
        const dataParams = [limit, offset, prefId, tenantId, statusCode, startDate, endDate];
        let dataQuery = `
    SELECT
      pf.prefecture_name,
      p.tenant_id,
      t.tenant_name,
      p.patient_id,
      p.patient_full_name,
      p.patient_kana_name,
      p.patient_code_name,
      r.reha_no,
      r.reha_start_time,
      r.reha_end_time,
      r.err_code,
      rs.reha_status_code,
      rs.reha_status_name,
      rs.reha_status_color
    FROM patients p
    INNER JOIN tenants t ON p.tenant_id = t.tenant_id
    INNER JOIN rehabilitations r ON p.patient_id = r.patient_id
    INNER JOIN reha_status rs ON r.reha_status_code = rs.reha_status_code
    INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id 
    WHERE t.prefecture_id = $3
      AND p.tenant_id = $4
      AND r.reha_status_code = $5
      AND r.reha_start_time >= $6
      AND r.reha_end_time <= $7
    ORDER BY p.patient_id, r.reha_start_time DESC`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParams);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// アラート一覧取得
app.get("/api/alerts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        // 総件数取得用クエリ
        const countParams = [];
        const countQuery = `
      SELECT COUNT(alert_id) AS count
      FROM alert
      WHERE 1=1`;
        // データ取得用クエリ
        const dataParams = [limit, offset];
        let dataQuery = `
    SELECT
      a.alert_id,
      a.alert_desc,
      a.err_code,
      a.severity_code,
      s.severity_name,
      s.severity_color,
      a.event_time,
      a.serial_no,
      a.send_alert_notice,
      a.tenant_id,
      t.tenant_name,
      a.tenant_user_id,
      a.patient_id,
      p.patient_full_name
    FROM 
      alert a
    LEFT JOIN severity s ON a.severity_code = s.severity_code
    LEFT JOIN tenants t ON a.tenant_id = t.tenant_id
    LEFT JOIN patients p ON a.patient_id = p.patient_id
    WHERE 1=1
    ORDER BY a.event_time DESC`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// テナントステータス取得
app.get("/api/facility/statuses/new", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        tenant_status_code AS id,
        tenant_status_name AS name, 
        tenant_status_color AS color
      FROM tenant_status
      WHERE is_new_select = true
      ORDER BY tenant_status_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// テナントステータス取得
app.get("/api/facility/statuses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        tenant_status_code AS id,
        tenant_status_name AS name, 
        tenant_status_color AS color
      FROM tenant_status
      WHERE 1=1
      ORDER BY tenant_status_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// テナント取得
app.get("/api/facility", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.query.tenantId;
        // データ取得用クエリ
        const dataParams = [tenantId];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name AS facility_name,
      t.tenant_kana,
      t.country_no,
      t.postal_code,
      t.address1,
      t.address2,
      t.address3,
      t.tel1,
      t.tel2,
      t.fax,
      t.email,
      t.tenant_status_code,
      ts.tenant_status_name,
      ts.tenant_status_color,
      t.training
    FROM 
      tenants t
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      INNER JOIN tenant_status ts ON t.tenant_status_code = ts.tenant_status_code
      WHERE 1=1
        AND tenant_id = $1`;
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            item: dataResult.rows[0],
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// テナント更新
app.put("/api/facility", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.body.tenant_id; // リクエストボディからテナントIDを取得
        const tenantData = req.body; // 更新するテナントのデータ
        // UPDATE用クエリ
        let updateQuery = `
    UPDATE tenants SET
      prefecture_id = $1,
      tenant_name = $2,
      tenant_kana = $3,
      country_no = $4,
      postal_code = $5,
      address1 = $6,
      address2 = $7,
      address3 = $8,
      tel1 = $9,
      tel2 = $10,
      fax = $11,
      email = $12,
      tenant_status_code = $13,
      training = $14
    WHERE tenant_id = $15`;
        // クエリパラメータ
        const updateParams = [
            tenantData.prefecture_id,
            tenantData.tenant_name,
            tenantData.tenant_kana,
            tenantData.country_no,
            tenantData.postal_code,
            tenantData.address1,
            tenantData.address2,
            tenantData.address3,
            tenantData.tel1,
            tenantData.tel2,
            tenantData.fax,
            tenantData.email,
            tenantData.tenant_status_code,
            tenantData.training,
            tenantId
        ];
        // データを更新
        yield pool.query(updateQuery, updateParams);
        res.send("Tenant updated successfully");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// テナント一覧取得
app.get("/api/facilities", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const tenantName = req.query.tenantName;
        const tenantNamePattern = `%${tenantName}%`;
        // 総件数取得用クエリ
        const countParams = [tenantNamePattern];
        const countQuery = `
      SELECT COUNT(tenant_id) AS count
      FROM tenants
      WHERE 1=1
        AND tenant_name LIKE $1 || '%'`;
        // データ取得用クエリ
        const dataParams = [limit, offset, tenantNamePattern];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name AS facility_name,
      t.tenant_kana,
      t.country_no,
      t.postal_code,
      t.address1,
      t.address2,
      t.address3,
      t.tel1,
      t.tel2,
      t.fax,
      t.email,
      t.tenant_status_code,
      ts.tenant_status_name,
      ts.tenant_status_color,
      t.training
    FROM 
      tenants t
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      INNER JOIN tenant_status ts ON t.tenant_status_code = ts.tenant_status_code
      WHERE 1=1
      AND tenant_name LIKE $3 || '%'
    ORDER BY t.prefecture_id, t.tenant_id
    `;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParams);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 医療者取得（テナント配下）
app.get("/api/facility/staff", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.query.tenantId;
        // データ取得用クエリ
        const dataParams = [tenantId];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name,
      ms.staff_id,
      ms.staff_full_name,
      ms.staff_kana_name,
      ms.staff_code_name,
      ms.email,
      ms.account_active,
      ms.password_reset,
      ms.login_time,
      ms.logout_time
    FROM 
      medical_staff ms
      INNER JOIN tenants t ON ms.tenant_id = t.tenant_id
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      WHERE 1=1
        AND ms.tenant_id = $1
    ORDER BY ms.account_active DESC, t.prefecture_id, t.tenant_id, ms.staff_id
    `;
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 医療者取得（氏名検索）
app.get("/api/staff/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const staffName = req.query.staffName;
        const staffNamePattern = `%${staffName}%`;
        // 総件数取得用クエリ
        const countParams = [staffNamePattern];
        const countQuery = `
      SELECT COUNT(staff_id) AS count
      FROM medical_staff
      WHERE 1=1
        AND staff_full_name LIKE $1 || '%'`;
        // データ取得用クエリ
        const dataParams = [limit, offset, staffNamePattern];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name,
      ms.staff_id,
      ms.staff_full_name,
      ms.staff_kana_name,
      ms.staff_code_name,
      ms.email,
      ms.account_active,
      ms.password_reset,
      ms.login_time,
      ms.logout_time
    FROM 
      medical_staff ms
      INNER JOIN tenants t ON ms.tenant_id = t.tenant_id
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      WHERE 1=1
      AND staff_full_name LIKE $3 || '%'
    ORDER BY ms.account_active DESC, t.prefecture_id, t.tenant_id, ms.staff_id
    `;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParams);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 患者取得（テナント配下）
app.get("/api/facility/patient", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = req.query.tenantId;
        // データ取得用クエリ
        const dataParam = [tenantId];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name,
      p.patient_id,
      p.patient_full_name,
      p.patient_kana_name,
      p.patient_code_name,
      p.birthday,
      p.account_active
    FROM 
      patients p
      INNER JOIN tenants t ON p.tenant_id = t.tenant_id
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      WHERE 1=1
        AND p.tenant_id = $1
      ORDER BY p.account_active DESC, t.prefecture_id, p.tenant_id, p.patient_id
    `;
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParam);
        res.json({
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// 患者取得（氏名検索）
app.get("/api/patients/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const patientName = req.query.patientName;
        const patientNamePattern = `%${patientName}%`;
        // 総件数取得用クエリ
        const countParam = [patientNamePattern];
        const countQuery = `
      SELECT COUNT(patient_id) AS count
      FROM patients
      WHERE 1=1
        AND patient_full_name LIKE $1 || '%'`;
        // データ取得用クエリ
        const dataParam = [limit, offset, patientNamePattern];
        let dataQuery = `
    SELECT
      t.prefecture_id,
      pf.prefecture_name,
      t.tenant_id,
      t.tenant_name,
      p.patient_id,
      p.patient_full_name,
      p.patient_kana_name,
      p.patient_code_name,
      p.birthday,
      p.is_start_remote_rehabilitaion,
      p.account_active
    FROM 
      patients p
      INNER JOIN tenants t ON p.tenant_id = t.tenant_id
      INNER JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
      WHERE 1=1
      AND patient_full_name LIKE $3 || '%'
    ORDER BY p.account_active DESC, t.prefecture_id, p.tenant_id, p.patient_id
    `;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParam);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParam);
        res.json({
            totalItem: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイスタイプ取得
app.get("/api/device/types", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        device_type_code AS id,
        device_type_name AS name
      FROM device_types
      WHERE 1=1
      ORDER BY device_type_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイスステータス取得
app.get("/api/device/statuses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        device_status_code AS id,
        device_status_name AS name,
        device_status_color AS color
      FROM device_status
      WHERE 1=1
      ORDER BY device_status_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス一覧取得（デバイスタイプ、デバイスステータスまたはシリアルナンバー）
app.get("/api/devices", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deviceType = parseInt(req.query.deviceType);
        const deviceStatus = parseInt(req.query.deviceStatus);
        const serialNo = req.query.serialNo;
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        // パラメータチェック
        // if (deviceStatus === -1) {
        //   return res.json([]);
        // }
        let dataQuery = `
    SELECT
        d.device_id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        d.tenant_id,
        d.patient_id,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    WHERE 1=1`;
        const params = [limit, offset];
        let whereQuery = "";
        const countParams = [];
        if (serialNo !== "") {
            const serialNoPattern = `%${serialNo}%`;
            dataQuery += " AND d.serial_no LIKE $3";
            whereQuery += " AND d.serial_no LIKE $1";
            params.push(serialNoPattern);
            countParams.push(serialNoPattern);
        }
        else {
            if (!isNaN(deviceType) && deviceType !== -1) {
                dataQuery += " AND d.device_type_code = $3";
                whereQuery += " AND d.device_type_code = $1";
                params.push(deviceType);
                countParams.push(deviceType);
            }
            if (!isNaN(deviceStatus) && deviceStatus !== -1) {
                dataQuery += " AND d.device_status_code = $4";
                whereQuery += " AND d.device_status_code = $2";
                params.push(deviceStatus);
                countParams.push(deviceStatus);
            }
        }
        dataQuery += " LIMIT $1 OFFSET $2";
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, params.filter(p => p !== undefined));
        // 総件数取得用クエリ
        const countQuery = `SELECT COUNT(d.device_id) AS count FROM devices d WHERE 1=1 ${whereQuery}`;
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス一覧取得（シリアルナンバー）
app.get("/api/devices/serialNo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const serialNo = req.query.searchText;
        const serialNoPattern = `%${serialNo}%`;
        const isOS = req.query.isOS;
        // 総件数取得用クエリ
        const countParams = [serialNoPattern];
        let countQuery = `
      SELECT COUNT(d.serial_no) AS count
      FROM devices d
      WHERE d.serial_no LIKE $1`;
        if (isOS === "true") {
            countQuery += " AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        const dataParams = [limit, offset, serialNoPattern];
        let whereQuery = " WHERE d.serial_no LIKE $3";
        if (isOS === "true") {
            whereQuery += "  AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        let dataQuery = `
    SELECT
        d.device_id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        t.prefecture_id,
        pf.prefecture_name,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        p.birthday,
        d.installation_set_number,
        d.is_checking,
        d.checking_result,
        d.checking_datetime,
        p.patient_full_name,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    LEFT JOIN device_types dt ON d.device_type_code = dt.device_type_code
    LEFT JOIN device_status ds ON d.device_status_code = ds.device_status_code
    LEFT JOIN tenants t ON d.tenant_id = t.tenant_id
    LEFT JOIN patients p ON d.patient_id = p.patient_id
    LEFT JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id`;
        dataQuery += whereQuery;
        dataQuery += " ORDER BY installation_set_number, device_type_code";
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス一覧取得（患者ID）
app.get("/api/devices/patient/id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const patientId = req.query.patientId;
        // 総件数取得用クエリ
        const countParams = [patientId];
        const countQuery = `
      SELECT COUNT(patient_id) AS count
      FROM devices
      WHERE 1=1
        AND patient_id = $1`;
        const dataParams = [limit, offset, patientId];
        let dataQuery = `
    SELECT
        d.device_id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        p.patient_full_name,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    JOIN tenants t ON d.tenant_id = t.tenant_id
    JOIN patients p ON d.patient_id = p.patient_id
    WHERE 1=1
      AND d.patient_id = $3
      ORDER BY device_type_code`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス一覧取得（患者氏名）
app.get("/api/devices/patient/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const patientName = req.query.searchText;
        const patientNamePattern = `%${patientName}%`;
        const isOS = req.query.isOS;
        // 総件数取得用クエリ
        const countParams = [patientNamePattern];
        let countQuery = `
      SELECT COUNT(d.patient_id) AS count
      FROM devices d
      JOIN patients p ON d.patient_id = p.patient_id
      WHERE p.patient_full_name LIKE $1`;
        if (isOS === "true") {
            countQuery += " AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        const dataParams = [limit, offset, patientNamePattern];
        let whereQuery = " WHERE p.patient_full_name LIKE $3";
        if (isOS === "true") {
            whereQuery += "  AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        let dataQuery = `
    SELECT
        d.id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        t.prefecture_id,
        pf.prefecture_name,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        p.birthday,
        d.installation_set_number,
        d.is_checking,
        d.checking_result,
        d.checking_datetime,
        p.patient_full_name,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    JOIN tenants t ON d.tenant_id = t.tenant_id
    JOIN patients p ON d.patient_id = p.patient_id
    JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id`;
        dataQuery += whereQuery;
        dataQuery += " ORDER BY installation_set_number, device_type_code";
        // データ取得用クエリ
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス一覧取得（医療機関名）
app.get("/api/devices/institution/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const institutionName = req.query.searchText;
        const institutionNamePattern = `%${institutionName}%`;
        const isOS = req.query.isOS;
        const deviceTypeCode = req.query.deviceTypeCode;
        // 総件数取得用クエリ
        const countParams = [institutionNamePattern];
        let countQuery = `
      SELECT COUNT(d.tenant_id) AS count
      FROM devices d
      JOIN tenants t ON d.tenant_id = t.tenant_id
      WHERE  d.patient_id IS NULL AND t.tenant_name LIKE $1`;
        if (isOS === "true") {
            countQuery += " AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        if (deviceTypeCode !== undefined) {
            countParams.push(deviceTypeCode);
            countQuery += " AND d.device_type_code = $" + countParams.length;
        }
        // データ取得用クエリ
        const dataParams = [limit, offset, institutionNamePattern];
        let whereQuery = " WHERE d.patient_id IS NULL AND t.tenant_name LIKE $3";
        if (isOS === "true") {
            whereQuery += "  AND (d.device_type_code = 10 OR d.device_type_code = 60)";
        }
        if (deviceTypeCode !== undefined) {
            dataParams.push(deviceTypeCode);
            whereQuery += " AND d.device_type_code = $" + dataParams.length;
        }
        let dataQuery = `
    SELECT
        d.id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        d.installation_set_number,
        DATE(d.setup_date) AS setup_date,
        t.prefecture_id,
        pf.prefecture_name,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        d.is_checking,
        d.checking_result,
        d.checking_datetime,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    JOIN tenants t ON d.tenant_id = t.tenant_id
    JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id`;
        dataQuery += whereQuery;
        dataQuery += " ORDER BY installation_set_number, device_type_code";
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams);
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// デバイス取得（患者フルネーム AND OSデバイス）
app.get("/api/devices/patient/matching/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const patientFullName = req.query.searchText;
        // 総件数取得用クエリ
        const countParams = [patientFullName];
        const countQuery = `
      SELECT COUNT(d.patient_id) AS count
      FROM devices d
      JOIN patients p ON d.patient_id = p.patient_id
      WHERE p.patient_full_name = $1`;
        const dataParams = [limit, offset, patientFullName];
        let dataQuery = `
    SELECT
        d.id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        t.prefecture_id,
        pf.prefecture_name,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        p.birthday,
        d.installation_set_number,
        d.is_checking,
        d.checking_result,
        d.checking_datetime,
        p.patient_full_name,
        p.rehabilitaion_end_date,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    JOIN tenants t ON d.tenant_id = t.tenant_id
    JOIN patients p ON d.patient_id = p.patient_id
    JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
    WHERE p.patient_full_name = $3
      AND (d.device_type_code = 10 OR d.device_type_code = 60)
    ORDER BY installation_set_number, device_type_code`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// タブレット取得（患者氏名）
app.get("/api/devices/tablet/patient/name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const patientName = req.query.patientName;
        const patientNamePattern = `%${patientName}%`;
        // 総件数取得用クエリ
        const countParams = [patientNamePattern];
        const countQuery = `
      SELECT COUNT(d.patient_id) AS count
      FROM devices d
      JOIN patients p ON d.patient_id = p.patient_id
      WHERE p.patient_full_name LIKE $1
        AND d.device_type_code = 10`;
        const dataParams = [limit, offset, patientNamePattern];
        let dataQuery = `
    SELECT
        d.id,
        d.serial_no,
        d.mac_address,
        d.device_type_code,
        d.device_status_code,
        DATE(d.setup_date) AS setup_date,
        t.prefecture_id,
        pf.prefecture_name,
        d.tenant_id,
        t.tenant_name,
        d.patient_id,
        p.birthday,
        p.patient_full_name,
        d.checking_datetime,
        d.checking_result,
        d.more_info,
        dt.device_type_name,
        ds.device_status_name,
        ds.device_status_color
    FROM devices d
    JOIN device_types dt ON d.device_type_code = dt.device_type_code
    JOIN device_status ds ON d.device_status_code = ds.device_status_code
    JOIN tenants t ON d.tenant_id = t.tenant_id
    JOIN patients p ON d.patient_id = p.patient_id
    JOIN prefectures pf ON t.prefecture_id = pf.prefecture_id
    WHERE 1=1
      AND p.patient_full_name LIKE $3
      AND d.device_type_code = 10`;
        dataQuery += " LIMIT $1 OFFSET $2";
        // 総件数取得用クエリ
        const countResult = yield pool.query(countQuery, countParams.filter(p => p !== undefined));
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery, dataParams.filter(p => p !== undefined));
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お知らせ種類取得
app.get("/api/notice/types", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        notice_type_code AS id,
        notice_type_name AS name,
        notice_type_color AS color
      FROM notice_types
      WHERE 1=1
      ORDER BY notice_type_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お知らせ一覧取得
app.get("/api/notifications", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // データ取得用クエリ
        let dataQuery = `
    SELECT
      n.notice_id,
      n.title,
      n.message,
      n.app_code,
      s.app_name,
      s.app_color,
      n.notice_type_code,
      nt.notice_type_name,
      nt.notice_type_color,
      n.start_date,
      n.end_date
    FROM 
      notifications n
      INNER JOIN apps s ON n.app_code = s.app_code
      INNER JOIN notice_types nt ON n.notice_type_code = nt.notice_type_code
      WHERE 1=1
      ORDER BY n.notice_id DESC, n.start_date DESC
    `;
        // データを取得
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お知らせ一覧取得（通知用）
app.get("/api/notifications/bell", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = req.query.today;
        const appCode = req.query.appCode;
        const limit = req.query.limit;
        // データ取得用クエリ
        const dataParams = [appCode, today, limit];
        let dataQuery = `
    SELECT
      n.notice_id,
      n.title,
      n.message,
      n.app_code,
      s.app_name,
      s.app_color,
      n.notice_type_code,
      nt.notice_type_name,
      nt.notice_type_color,
      n.start_date,
      n.end_date,
      n.creation_time
    FROM 
      notifications n
      INNER JOIN apps s ON n.app_code = s.app_code
      INNER JOIN notice_types nt ON n.notice_type_code = nt.notice_type_code
      WHERE 1=1
        AND n.app_code = $1
        AND n.start_date <= $2
        AND n.end_date >= $2
      ORDER BY n.start_date DESC
      LIMIT $3
      `;
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お問い合わせ一覧取得
app.get("/api/contactUs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page);
        const pageSize = parseInt(req.query.pageSize);
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const title = req.query.title;
        const titlePattern = `%${title}%`;
        // 総件数取得用クエリ
        const countParams = [titlePattern];
        const countQuery = `
      SELECT COUNT(id) AS count
      FROM contact_us
      WHERE 1=1
        AND title LIKE $1 || '%'`;
        // データ取得用クエリ
        const dataParams = [titlePattern, limit, offset];
        let dataQuery = `
    SELECT
      c.id,
      c.category_code,
      c.title,
      c.question_content,
      c.question_user_id,
      c.answer,
      c.answer_user_id,
      c.status_code,
      c.creation_time,
      c.update_time,
      ct.category_name,
      cs.status_name,
      cs.status_color
    FROM 
      contact_us c
      INNER JOIN contact_us_category ct ON c.category_code = ct.category_code
      INNER JOIN contact_us_status cs ON c.status_code = cs.status_code
    WHERE
      c.title LIKE $1
    ORDER BY
      c.status_code, c.id, c.creation_time DESC, c.update_time DESC
    LIMIT $2 OFFSET $3
    `;
        // 総件数を取得
        const countResult = yield pool.query(countQuery, countParams);
        // データを取得
        const dataResult = yield pool.query(dataQuery, dataParams);
        res.json({
            totalItems: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / pageSize),
            items: dataResult.rows,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// お問い合わせカテゴリー取得
app.get("/api/contactUs/categories", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataQuery = `
      SELECT
        category_code AS id,
        category_name AS name,
        category_color AS color
      FROM contact_us_category
      WHERE 1=1
      ORDER BY category_code`;
        // データ取得用クエリ
        const dataResult = yield pool.query(dataQuery);
        res.json({
            items: dataResult.rows
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}));
// EMMトークン取得用の関数
function getEMMToken(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            const response = yield axios.post(`${EMM_BASE_URL}/auth/login`, formData);
            if (response.data && response.data.access_token) {
                return response.data.access_token;
            }
            else {
                throw new Error('Token not found in the response');
            }
        }
        catch (error) {
            console.error('Error fetching EMM token:', error);
            throw new Error('Failed to retrieve EMM token');
        }
    });
}
// EMMアクセストークン取得
app.get('/api/emm/token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        console.log('accessToken:', accessToken);
        res.json({ accessToken: accessToken });
    }
    catch (error) {
        res.status(500).send('Internal Server Error');
    }
}));
// デバイスの再起動
app.post('/api/emm/reboot', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        const postData = {
            deviceIDs: req.body.deviceIDs
        };
        const url = `${EMM_BASE_URL}/devices/reboot-devices`;
        const response = yield axios.post(url, postData, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `bearer ${accessToken}`
            }
        });
        console.log(response);
        res.json(response.code);
    }
    catch (error) {
        console.error('Error during device reboot:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// デバイス一覧の情報取得
app.get('/api/emm/devices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        const url = `${EMM_BASE_URL}/devices`;
        console.log('url:', url);
        const response = yield axios.get(url, {
            params: {},
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        console.log(response);
        res.json(response.data);
    }
    catch (error) {
        console.error('Error during device reboot:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// デバイス一覧の詳細情報取得
app.get('/api/emm/info/id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        const deviceIdentifier = req.query.id;
        const url = `${EMM_BASE_URL}/devices/android/${deviceIdentifier}/info`;
        console.log('url:', url);
        const response = yield axios.get(url, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        console.log(response);
        res.json(response.data);
    }
    catch (error) {
        console.error('Error during device reboot:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// デバイスの情報取得
app.get('/api/emm/info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        const url = `${EMM_BASE_URL}/v2/device/info`;
        const response = yield axios.get(url, {
            params: {
                imei: req.query.imei
            },
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });
        console.log(response);
        res.json(response.data);
    }
    catch (error) {
        console.error('Error during device reboot:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
// デバイスの休止状態
app.post('/api/emm/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getEMMToken('nmorikawa@remohab.com', '2q47112q');
        const postData = {
            imei: req.body.imei,
            hibernation_status: req.body.hibernation_status
        };
        const url = `${EMM_BASE_URL}/v2/device/info`;
        console.log('url:', url);
        console.log('postData:', postData);
        const response = yield axios.post(url, postData, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `bearer ${accessToken}`
            }
        });
        console.log(response);
        res.json(response.code);
    }
    catch (error) {
        console.error('Error during device reboot:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
