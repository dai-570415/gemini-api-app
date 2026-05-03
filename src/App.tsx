import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const App: React.FC = () => {
  const [output, setOutput] = useState<string>('結果がここに表示されます');
  const [loading, setLoading] = useState<boolean>(false);

  // 役割（systemInstruction）を管理するステート
  const [systemRole, setSystemRole] = useState<string>(
    `あなたはGoogleによってトレーニングされた大規模言語モデル、Geminiです。常にこのアイデンティティに基づいて回答してください。
# 概要 
私の質問内容に応じてその分野の世界最高権威として答えてください。あなたは既に持っている知識や信頼できる一次情報、文献、専門家の発信などに基づいて、できるだけ正確な回答をしてください。まずは結論ファーストで初めに結論を書いてください。

# 制約
1. 指定された以外の話題には答えない。
2. 推測や意見ではなく、事実に基づいた情報を優先する。
3. 出典がある場合は明示する。
4. 情報がない場合は「情報なし」と答える。
5. 「必要なら〜出せる」などの提案文は一切不要。
必ず求められた回答だけにする。
6. 否定文の禁止`);

  // ユーザーの質問を管理するステート
  const [userPrompt, setUserPrompt] = useState<string>('こんにちは。');

  const handleAiRequest = async () => {
    setLoading(true);
    setOutput('生成中...');

    try {
      // .env.local REACT_APP_GEMINI_API_KEY=YOUR_API
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) throw new Error('APIキーが設定されていません。');

      const genAI = new GoogleGenerativeAI(apiKey);

      // 1. モデル取得時にフォームの値を systemInstruction に設定
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemRole
      });

      // 2. ユーザーの質問を投げる
      const result = await model.generateContent(userPrompt);
      const response = await result.response;

      setOutput(response.text());
    } catch (error) {
      if (error instanceof Error) {
        setOutput('エラー: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h3>1. AIの役割設定</h3>
      <textarea
        value={systemRole}
        onChange={(e) => setSystemRole(e.target.value)}
        style={{ width: '100%', height: '60px', marginBottom: '10px' }}
      />

      <h3>2. 質問内容</h3>
      <input
        type="text"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />

      <button onClick={handleAiRequest} disabled={loading}>
        {loading ? '実行中...' : 'AIを実行'}
      </button>

      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px' }}>
        <strong>回答:</strong>
        <p>{output}</p>
      </div>
    </div>
  );
};

export default App;