// テスト基盤（Vitest + jsdom + setup.ts のスタブ）が動作することを確認する
describe('テスト基盤のスモークテスト', () => {
    it('Canvas 2D コンテキストのスタブが描画メソッドを持つ', () => {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) throw new Error('Canvas 2D コンテキストのスタブが設定されていない');

        expect(ctx.measureText('')).toHaveProperty('width', 0);
        expect(() => ctx.fillRect(0, 0, 1, 1)).not.toThrow();
    });

    it('ResizeObserver のスタブが observe / unobserve / disconnect を呼べる', () => {
        const observer = new ResizeObserver(() => {});

        expect(() => {
            observer.observe(document.body);
            observer.unobserve(document.body);
            observer.disconnect();
        }).not.toThrow();
    });

    it('devicePixelRatio が 1 に固定されている', () => {
        expect(window.devicePixelRatio).toBe(1);
    });
});
