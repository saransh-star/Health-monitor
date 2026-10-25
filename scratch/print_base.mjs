async function test() {
  const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css?v=1792912830534');
  const css = await res.text();
  const idx = css.indexOf('@layer base');
  console.log('Index of @layer base:', idx);
  if (idx !== -1) {
    console.log(css.slice(idx, idx + 1200));
  }
}
test();
