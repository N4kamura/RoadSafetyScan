import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edgeProc = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  'http://localhost:5173/'
]);

async function run() {
  // Wait 2s for edge to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    console.log('Tabs:', tabs.map(t => ({ id: t.id, title: t.title, url: t.url })));

    const tab = tabs.find(t => t.url.includes('5173')) || tabs[0];
    if (!tab || !tab.webSocketDebuggerUrl) {
      console.log('No webSocketDebuggerUrl found');
      edgeProc.kill();
      return;
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    await new Promise((resolve) => ws.onopen = resolve);
    console.log('Connected to CDP WebSocket');

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails);
      }
    });

    await send('Runtime.enable');
    await send('Log.enable');

    // Wait 3s for page to execute
    await new Promise(r => setTimeout(r, 3000));

    // Evaluate window.__RSS_DIAGNOSTICS__ and check document.title
    const evalDiag = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ title: document.title, diag: window.__RSS_DIAGNOSTICS__, mapLoaded: !!window.mapInstance, layers: window.mapInstance ? window.mapInstance.getStyle().layers.map(l => l.id) : null })'
    });
    console.log('EVAL RESULT:', evalDiag.result.value);

    // Let's also inspect DOM elements: kpi values
    const evalKpi = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ kpiKm: document.getElementById(' + JSON.stringify('kpi-total-km') + ')?.textContent, kpiInside: document.getElementById(' + JSON.stringify('kpi-inside-buffer') + ')?.textContent, kpiHotspot: document.getElementById(' + JSON.stringify('kpi-hotspot-station') + ')?.textContent })'
    });
    console.log('KPI RESULT:', evalKpi.result.value);

    await send('Page.enable');
    
    // Simulate switching corridor to PE-1N
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sel = document.getElementById('select-corridor-trace');
          sel.value = 'PE-1N';
          sel.dispatchEvent(new Event('change'));
          document.getElementById('btn-run-calculation').click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    const evalKpiNorte = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ kpiKm: document.getElementById("kpi-total-km")?.textContent, kpiInside: document.getElementById("kpi-inside-buffer")?.textContent, kpiEpdo: document.getElementById("kpi-total-epdo")?.textContent, kpiHotspot: document.getElementById("kpi-hotspot-station")?.textContent })'
    });
    console.log('KPI NORTE RESULT:', evalKpiNorte.result.value);

    const screenshotNorte = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('scripts/screenshot-render-norte.png', Buffer.from(screenshotNorte.data, 'base64'));
    console.log('Screenshot saved to scripts/screenshot-render-norte.png');

    ws.close();
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    edgeProc.kill();
  }
}

run();
