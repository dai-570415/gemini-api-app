import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const GenerateText: React.FC = () => {
    const [output, setOutput] = useState<string>('結果がここに表示されます');
    const [loading, setLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    // 確認用プロンプトを表示するステート
    const [debugPrompt, setDebugPrompt] = useState<string>('');

    // 共通のプロンプト作成ロジック
    const createFinalPrompt = (inputTitle: string) => {
        return `# 依頼
以下のタイトルに基づき、日本市場向けのYouTube / SNS用サムネイル画像生成プロンプトを作成してください。
画像生成AI（Nano Banana 2）が理解できる、詳細かつ情緒的な「日本語の指示文」のみを出力してください。

# ターゲットタイトル
${inputTitle}

# モダンな日本風デザインへの必須命令
1. **文字の指定**:
- 「${inputTitle}」と描写すること。
2. **色彩とトーン（モダン・ジャパン）**:
- 原色を避け、洗練されたカラーや、透明感のあるグラデーションを基調とすること。
- 清潔感があり、プロフェッショナルが制作したような広告デザインのトーンを目指すこと。
3. **構図（情報の整理）**:
- 画面の左右どちらかに大きなホワイトスペースを作り、そこにタイトルを配置すること。
- 被写体は中央ではなく、あえて少しずらして配置する「三分割法」を取り入れ、モダンな奥行きを出すこと。

# 出力形式
解説や英語は含めず、画像生成ツールにそのまま入力できる「日本語のプロンプトのみ」を出力してください。`;
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
            // const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

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
        <div>
            <h3>タイトル</h3>
            <input
                type='text'
                placeholder='例：生成AIアプリ入門'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <div>
                <button onClick={handleAiRequest} disabled={loading}>
                    {loading ? '生成中...' : 'AIを実行'}
                </button>
                <button onClick={handleCheckPrompt}>
                    送信プロンプトを確認
                </button>
            </div>

            {debugPrompt && (
                <div style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px dashed #ccc', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                    <strong>【送信されるプロンプト】</strong><br />
                    {debugPrompt}
                </div>
            )}

            <div style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px dashed #ccc', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                <strong>回答:</strong>
                <p>{output}</p>
            </div>
        </div>
    );
};