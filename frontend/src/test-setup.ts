import '@testing-library/jest-dom/vitest';

// ============================================================================
// jsdom に無い／不足しているブラウザAPIのスタブ。
// Canvas描画・要素サイズ計測のコードを jsdom 上で読み込めるようにする。
// アサーションは書かず、環境の下準備のみを行う。
// ============================================================================

// ResizeObserver: コンテナのサイズ追従で使用するが jsdom には未実装
class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}
Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
});

// matchMedia: メディアクエリの判定は常に false を返す最小実装
Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
        media: query,
        matches: false,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});

// devicePixelRatio: 高DPI判定はテストでは常に 1 とする
Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 1,
});

// Canvas 2D コンテキスト: jsdom は null を返すため、描画呼び出しを受け止めるスタブを返す
const canvasContextStub = {
    measureText: () => ({ width: 0 }),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setTransform: vi.fn(),
    // 描画コードが代入する状態プロパティ
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    imageSmoothingEnabled: true,
    globalAlpha: 1,
};
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: () => canvasContextStub,
});
