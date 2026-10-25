async function test() {
  const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css?v=1792912709458');
  const css = await res.text();
  
  // Find where .dark is used
  const darkMatches = css.match(/(\.dark[^{]*\{[^}]*\})/g) || [];
  console.log('Total .dark rules:', darkMatches.length);
  for (const m of darkMatches.slice(0, 10)) {
    console.log('--- DARK RULE ---', m);
  }

  // Find .apple-card
  const cardMatches = css.match(/(\.apple-card[^{]*\{[^}]*\})/g) || [];
  console.log('Total .apple-card rules:', cardMatches);

  // Find body rules
  const bodyMatches = css.match(/(body[^{]*\{[^}]*\})/g) || [];
  console.log('Total body rules:', bodyMatches);
}
test();
