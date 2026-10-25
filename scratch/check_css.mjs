async function test() {
  try {
    const res = await fetch('http://localhost:3000/');
    const html = await res.text();
    console.log('HTML length:', html.length);
    const cssLinks = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)].map(m => m[1]);
    console.log('CSS links:', cssLinks);
    for (const link of cssLinks) {
      const cssRes = await fetch('http://localhost:3000' + link);
      const css = await cssRes.text();
      console.log(link, 'length:', css.length);
      console.log('has #fbf9f5:', css.includes('#fbf9f5'));
      console.log('has --bg-card:', css.includes('--bg-card'));
      console.log('has dark variant:', css.includes('.dark'));
    }
  } catch (err) {
    console.error(err);
  }
}
test();
