import { useState, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 【静的な定数】多ジャンルに対応したスタイル定義
const STYLE_OPTIONS = [
    // --- テック・モダン系 ---
    { id: 'future', label: '未来派テック', keyword: '未来感、液体金属、ネオン光彩' },
    { id: 'dark', label: 'ダークモード', keyword: 'ダークモード、深い影、ミニマル' },

    // --- ライフスタイル・美容・高級系 ---
    { id: 'natural', label: 'ナチュラル', keyword: '北欧風、自然光、柔らかな木目、清潔感' },
    { id: 'luxury', label: 'ラグジュアリー', keyword: '大理石、ゴールドのアクセント、高級感、シルクの光沢' },
    { id: 'organic', label: 'オーガニック', keyword: '植物の緑、手漉き和紙の質感、アースカラー' },

    // --- エンタメ・ポップ系 ---
    { id: 'pop', label: 'ポップ', keyword: 'ポップ、3D立体質感、鮮やかな配色' },
    { id: 'comic', label: 'コミック風', keyword: 'アメコミ風、強い輪郭線、ハーフトーン、ドット' },
    { id: 'retro', label: 'レトロ', keyword: 'ヴィンテージ、フィルム粒子、ノスタルジックな光沢' },

    // --- ビジネス・教養・和風系 ---
    { id: 'academic', label: 'アカデミック', keyword: '重厚な書斎、古い羊皮紙、インクの滲み、知性的' },
    { id: 'japan', label: '和モダン', keyword: '和紙のテクスチャ、筆文字の質感、伝統的な配色' },
    { id: 'studio', label: 'スタジオ撮影', keyword: '一眼レフのボケ味、プロ用ライティング、被写体へのフォーカス' },
];

export const GenerateText: React.FC = () => {
    // 【動的な変数】Stateなので小文字
    const [output, setOutput] = useState<string>('結果がここに表示されます');
    const [loading, setLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('生成AIでサムネイルを作成');
    const [debugPrompt, setDebugPrompt] = useState<string>('');
    const [copyLabel, setCopyLabel] = useState<string>('結果をコピー'); // コピーボタンの文言用

    const [width, setWidth] = useState<string>('1200');
    const [height, setHeight] = useState<string>('630');
    const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(['']);

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
3. **文字の統合**: 
- ターゲットのタイトルの文字を必ず含めること。
- タイトルに改行が含まれている場合は、その通りに複数行でレイアウトすること。
- **タイトルに改行が含まれていない場合は、必ず「1行」で水平に配置し、勝手に改行を入れないこと。**

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
        setCopyLabel('結果をコピー'); // 新しく生成を始めたらラベルを戻す

        try {
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
            if (!apiKey) throw new Error('APIキーが設定されていません。');

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

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

    // クリップボードコピー機能
    const handleCopy = async () => {
        if (output === '結果がここに表示されます' || output === '生成中...') return;

        try {
            await navigator.clipboard.writeText(output);
            setCopyLabel('コピー完了！');
            setTimeout(() => setCopyLabel('結果をコピー'), 2000); // 2秒後に戻す
        } catch (err) {
            alert('コピーに失敗しました。');
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
                style={{ width: '100%', padding: '8px', marginBottom: '20px', boxSizing: 'border-box', minHeight: '80px' }}
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
                <label>幅: <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} style={{ width: '80px', padding: '5px' }} /></label>
                <span>×</span>
                <label>高さ: <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={{ width: '80px', padding: '5px' }} /></label>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={handleAiRequest} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px', cursor: 'pointer' }}>
                    {loading ? '生成中...' : 'AIを実行'}
                </button>
                <button onClick={handleCheckPrompt} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    送信プロンプトを確認
                </button>
            </div>

            {debugPrompt && (
                <div style={{ backgroundColor: '#f0f0f0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px', whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                    <strong>【送信されるプロンプト】</strong><br />
                    {debugPrompt}
                </div>
            )}

            <div style={{ backgroundColor: '#eef9ff', padding: '15px', border: '1px solid #b3d4fc', borderRadius: '8px', whiteSpace: 'pre-wrap', position: 'relative' }}>
                <strong>AI回答（画像用プロンプト）:</strong>
                <p style={{ marginBottom: '40px' }}>{output}</p>

                {/* コピーボタンの追加 */}
                <button
                    onClick={handleCopy}
                    style={{
                        position: 'absolute',
                        bottom: '15px',
                        right: '15px',
                        padding: '8px 15px',
                        backgroundColor: '#fff',
                        border: '1px solid #b3d4fc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85em'
                    }}
                >
                    {copyLabel}
                </button>
            </div>
        </div>
    );
};