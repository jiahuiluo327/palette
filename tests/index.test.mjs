import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const indexUrl = pathToFileURL(join(projectRoot, "index.html")).href;
let renderedHtml;

function renderIndex() {
    if (renderedHtml) return renderedHtml;

    const profileDir = mkdtempSync(join(tmpdir(), "palette-index-test-"));

    try {
        const result = spawnSync(
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            [
                "--headless=new",
                "--disable-gpu",
                "--disable-background-networking",
                "--disable-background-mode",
                "--disable-component-update",
                "--no-sandbox",
                `--user-data-dir=${profileDir}`,
                "--virtual-time-budget=1000",
                "--dump-dom",
                indexUrl,
            ],
            { encoding: "utf8", timeout: 8000 },
        );

        assert.match(result.stdout, /<\/html>/, "Chrome 未返回完整的首页 DOM");
        renderedHtml = result.stdout;
        return renderedHtml;
    } finally {
        rmSync(profileDir, { recursive: true, force: true });
    }
}

test("首页展示导出功能和公告管理两个新增入口", () => {
    const html = renderIndex();

    assert.match(html, /href="导出功能\.html"[^>]*>[\s\S]*?导出功能/);
    assert.match(
        html,
        /href="公告管理、txt文件-交互原型\.html"[^>]*>[\s\S]*?公告管理、TXT 文件/,
    );
});

test("首页以语义化列表呈现页面入口", () => {
    const html = renderIndex();

    assert.match(html, /<ul class="page-list">/);
    assert.match(html, /<li class="page-item"(?:\s|>)/);
});
