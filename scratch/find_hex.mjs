async function test() {
  const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css?v=1792912830534');
  const css = await res.text();
  const idx = css.indexOf('#fbf9f5');
  console.log('Index of #fbf9f5:', idx);
  if (idx !== -1) {
    console.log(css.slice(Math.max(0, idx - 100), idx + 200));
  }
}
test();
