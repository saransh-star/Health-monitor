async function test() {
  const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css?v=1792912709458');
  const css = await res.text();
  
  const rootIndex = css.indexOf(':root');
  console.log('Index of :root:', rootIndex);
  if (rootIndex !== -1) {
    console.log(css.slice(rootIndex, rootIndex + 200));
  }
}
test();
