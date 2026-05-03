import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const App: React.FC = () => {
  const [output, setOutput] = useState<string>('結果がここに表示されます');
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  // 確認用プロンプトを表示するステート
  const [debugPrompt, setDebugPrompt] = useState<string>('');

  // 共通のプロンプト作成ロジック
  const createFinalPrompt = (inputTitle: string) => {
    return `タイトルに基づき、視聴者の目を引くYouTubeやSNS向けのサムネイル画像を生成してください。画像生成ツール（Nano Banana 2）を最大限に活用し、デザインの専門知識に基づいた視覚効果の高い画像を出力してください。まずは生成した画像、または画像生成のための詳細なプロンプトを提示してください。

# 成果物の仕様
- 画像サイズ：幅1200px × 高さ630px
- アスペクト比：約1.91:1（SNS OGP最適化サイズ）

今回のターゲットタイトル：${inputTitle}`;
  };

  const handleAiRequest = async () => {
    if (!title) {
      setOutput('タイトルを入力してください。');
      return;
    }

    setLoading(true);
    setOutput('生成中...');

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) throw new Error('APIキーが設定されていません。');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const finalPrompt = createFinalPrompt(title);
      const result = await model.generateContent(finalPrompt);
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

  // プロンプトの中身を表示する関数
  const handleCheckPrompt = () => {
    if (!title) {
      setDebugPrompt('タイトルを入力すると、ここに送信予定のプロンプトが表示されます。');
      return;
    }
    setDebugPrompt(createFinalPrompt(title));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h3>タイトル</h3>
      <input
        type='text'
        placeholder='例：初心者向けキャンプ入門'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={handleAiRequest} disabled={loading}>
          {loading ? '生成中...' : 'AIを実行'}
        </button>

        <button onClick={handleCheckPrompt} style={{ backgroundColor: '#eee', color: '#333' }}>
          送信プロンプトを確認
        </button>
      </div>

      {debugPrompt && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '10px', fontSize: '0.8rem', border: '1px dashed #ccc', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
          <strong>【送信されるプロンプト】</strong><br />
          {debugPrompt}
        </div>
      )}

      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px' }}>
        <strong>回答:</strong>
        <p>{output}</p>
      </div>
    </div>
  );
};

export default App;