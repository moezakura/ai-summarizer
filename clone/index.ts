import playwright from "playwright";
import fs from "fs";

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let loadPage =
    "https://www.inoreader.com/stream/user/1005147396/tag/%E8%89%AF%E3%81%8B%E3%81%A3%E3%81%9F/view/html?cs=m";

  await page.goto(loadPage);
  const title = await page.title();
  console.log(title);

  // key=url, value=title
  const urls = new Map<string, string>();

  while (true) {
    const items = await page.locator(".article_magazine_title_link").all();

    for (const item of items) {
      const url = await (await item.getAttribute("href"))!;
      const title = await item.innerText();
      urls.set(url, title);
    }

    console.log("items", urls);

    // jsonにMapを書き出す
    fs.writeFileSync(
      "urls.json",
      JSON.stringify(
        Object.fromEntries(urls),
        null,
        "\t",
      ),
    );

    try {
      await page.locator(".continuation_div>a").click();
    } catch (e) {
      console.error(e);
      break;
    }
  }

  await browser.close();
})();
