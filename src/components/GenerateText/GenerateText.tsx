import { useState, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// スタイルの定義データ
const STYLE_OPTIONS = [
    { id: 'minimal', label: 'ミニマル', keyword: 'ミニマル、清潔な空白' },
    { id: 'pop', label: 'ポップ', keyword: 'ポップ、3D立体質感' },
    { id: 'retro', label: 'レトロ', keyword: 'レトロ、ヴィンテージ光沢' },
    { id: 'dark', label: 'ダークモード', keyword: 'ダークモード、深い影' },
    { id: 'neon', label: 'ネオン光彩', keyword: 'ネオン、発光エフェクト' },
    { id: 'future', label: '未来派テック', keyword: '未来感、光彩' },
];

export const GenerateText: React.FC = () => {
    const [output, setOutput] = useState<string>('結果がここに表示されます');
    const [loading, setLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('生成AIでサムネイルを作成');
    const [debugPrompt, setDebugPrompt] = useState<string>('');

    // サイズ（幅・高さ）のステート
    const [width, setWidth] = useState<string>('1200');
    const [height, setHeight] = useState<string>('630');

    // 選択されたスタイルのIDを管理
    const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(['']);

    // 選択されたスタイルIDから、プロンプト用の文字列を生成
    const selectedStyleString = useMemo(() => {
        return STYLE_OPTIONS
            .filter(option => selectedStyleIds.includes(option.id))
            .map(option => option.keyword)
            .join('、');
    }, [selectedStyleIds]);

    const handleStyleChange = (id: string) => {
        setSelectedStyleIds(prev =>
            prev.includes(id) ? prev.filter(styleId => styleId !== id) : [...prev, id]
        );
    };

    // サイズ情報を含めたプロンプト作成ロジック
    // サイズ情報を含めたプロンプト作成ロジック
    const createFinalPrompt = (inputTitle: string, styles: string, w: string, h: string) => {
        return `# 依頼
以下の条件に基づき、画像生成AI（Nano Banana 2）専用のプロンプトを作成してください。

# ターゲット
- タイトル: ${inputTitle}
- スタイル: ${styles}
- サイズ（アスペクト比）: 幅${w}px × 高さ${h}px

# 品質ガイドライン
1. **ビジュアルの格付け**: 一般的なストックフォトの構図を避け、ハイエンドな広告・商用グラフィックのトーンで描写すること。
2. **空間設計**: 画面内に意図的な「視覚的余白」を配置し、主役となる要素を際立たせるミニマリズムな構成にすること。
3. **文字の統合**: ターゲットのタイトルの文字を必ず入れてデザインをつくること。**タイトル内に改行が含まれる場合は、その改行位置を維持したレイアウトを構成に反映させること。**

# 出力形式
解説や導入文は一切不要です。画像生成ツールにそのまま入力できる「日本語のプロンプトのみ」を1ブロックで出力してください。`;
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
            const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

            // サイズ変数を追加して呼び出し
            const finalPrompt = createFinalPrompt(title, selectedStyleString, width, height);
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

    const handleCheckPrompt = () => {
        if (!title) {
            setDebugPrompt('タイトルを入力すると、ここに送信予定のプロンプトが表示されます。');
            return;
        }
        setDebugPrompt(createFinalPrompt(title, selectedStyleString, width, height));
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif' }}>
            <h3>1. タイトル入力</h3>
            <textarea
                style={{ width: '100%', padding: '8px', marginBottom: '20px', boxSizing: 'border-box' }}
                placeholder='例：生成AIアプリ入門'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <h3>2. スタイル選択（複数可）</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {STYLE_OPTIONS.map(option => (
                    <label key={option.id} style={{ cursor: 'pointer', padding: '5px', border: '1px solid #eee', borderRadius: '4px' }}>
                        <input
                            type="checkbox"
                            checked={selectedStyleIds.includes(option.id)}
                            onChange={() => handleStyleChange(option.id)}
                        />
                        <span style={{ marginLeft: '8px' }}>{option.label}</span>
                    </label>
                ))}
            </div>

            <h3>3. サイズ設定 (px)</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <label>
                    幅: <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        style={{ width: '80px', padding: '5px' }}
                    />
                </label>
                <span>×</span>
                <label>
                    高さ: <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        style={{ width: '80px', padding: '5px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={handleAiRequest} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px' }}>
                    {loading ? '生成中...' : 'AIを実行'}
                </button>
                <button onClick={handleCheckPrompt} style={{ padding: '10px 20px' }}>
                    送信プロンプトを確認
                </button>
            </div>

            {debugPrompt && (
                <div style={{ backgroundColor: '#f0f0f0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px', whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                    <strong>【送信されるプロンプト】</strong><br />
                    {debugPrompt}
                </div>
            )}

            <div style={{ backgroundColor: '#eef9ff', padding: '15px', border: '1px solid #b3d4fc', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                <strong>AI回答（画像用プロンプト）:</strong>
                <p>{output}</p>
            </div>
        </div>
    );
};