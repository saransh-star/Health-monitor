async function test() {
  const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css?v=1792912709458');
  const css = await res.text();
  
  // Find :root and .dark variable blocks
  const rootIndex = css.indexOf('--bg-app');
  if (rootIndex !== -1) {
    console.log('Context around first --bg-app:');
    console.log(css.slice(Math.max(0, rootIndex - 100), rootIndex + 300));
  }
  const lastIndex = css.lastIndexOf('--bg-app');
  if (lastIndex !== rootIndex && lastIndex !== -1) {
    console.log('Context around second --bg-app:');
    console.log(css.slice(Math.max(0, lastIndex - 100), lastIndex + 300));
  }
}
test();
