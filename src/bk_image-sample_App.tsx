import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const App: React.FC = () => {
  const [outputPrompt, setOutputPrompt] = useState<string>(''); // 生成されたプロンプト用
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>(''); // 生成された画像URL用
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');

  // 1. プロンプト作成ロジック（そのまま）
  const createFinalPrompt = (inputTitle: string) => {
    return `# 依頼
以下のタイトルに基づき、日本市場向けのYouTube/SNS用サムネイル画像生成プロンプトを作成してください。
Nano Banana 2（Gemini 3 Flash Image）が理解できる、詳細かつ情緒的な「日本語の指示文」のみを出力してください。
ターゲットタイトル: ${inputTitle}
（以下、デザインの命令...）
# 出力形式
解説や英語は含めず、画像生成ツールにそのまま入力できる「日本語のプロンプトのみ」を出力してください。`;
  };

  const handleFullProcess = async () => {
    if (!title) return;
    setLoading(true);
    setGeneratedImageUrl('');

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) throw new Error('APIキーが設定されていません。');
      const genAI = new GoogleGenerativeAI(apiKey);

      // --- STEP 1: プロンプトを生成 (Flash Lite) ---
      const textModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
      const promptInstruction = createFinalPrompt(title);
      const textResult = await textModel.generateContent(promptInstruction);
      const refinedPrompt = textResult.response.text();
      setOutputPrompt(refinedPrompt);

      // --- STEP 2: 画像を生成 (Imagen 4) ---
      // 管理画面で確認された正確なIDを使用します
      const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

      // 画像生成リクエスト
      // 注: Imagen 4 APIの戻り値形式はSDKのバージョンにより異なる場合があります
      const imageResult = await imageModel.generateContent(refinedPrompt);
      const imageResponse = await imageResult.response;

      // 画像データ（Base64）を取得してData URLに変換
      const base64Data = imageResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Data) {
        setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      } else {
        throw new Error('画像データの取得に失敗しました。');
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h3>サムネイル生成</h3>
      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='タイトルを入力...'
        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
      />

      <button onClick={handleFullProcess} disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff' }}>
        {loading ? 'AIがデザインを生成中...' : '画像まで一気に生成'}
      </button>

      {/* 生成されたプロンプトの確認用 */}
      {outputPrompt && (
        <details style={{ marginTop: '20px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>生成されたプロンプトを確認</summary>
          <pre style={{ fontSize: '0.7rem', backgroundColor: '#eee', padding: '10px' }}>{outputPrompt}</pre>
        </details>
      )}

      {/* 画像の表示エリア */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        {generatedImageUrl ? (
          <div>
            <p><strong>完成したサムネイル:</strong></p>
            <img src={generatedImageUrl} alt="Generated" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <p style={{ fontSize: '0.8rem', color: '#666' }}>※アスペクト比 1.91:1</p>
          </div>
        ) : (
          <div style={{ height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #ccc' }}>
            {loading ? '画像をレンダリング中...' : 'ここに画像が表示されます'}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;