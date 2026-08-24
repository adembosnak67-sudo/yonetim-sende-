const STORE = 'yonetim-sende-v1';
const defaultTasks = [
  { id: crypto.randomUUID(), title: 'Haftalık planı gözden geçir', priority: 'high', done: false },
  { id: crypto.randomUUID(), title: 'Ekip toplantısı notlarını paylaş', priority: 'medium', done: true },
  { id: crypto.randomUUID(), title: 'Yeni hedefleri belirle', priority: 'low', done: false }
];
let tasks = JSON.parse(localStorage.getItem(STORE) || 'null') || defaultTasks;
let filter = 'all';
const $ = (selector) => document.querySelector(selector);

function persist() { localStorage.setItem(STORE, JSON.stringify(tasks)); }
function render() {
  const visible = tasks.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  $('#taskList').innerHTML = visible.map(t => `<li class="task ${t.done ? 'done' : ''}" data-id="${t.id}"><input class="task-check" type="checkbox" ${t.done ? 'checked' : ''} aria-label="Görevi tamamla"><span class="task-title"></span><span class="priority ${t.priority}">${{high:'Yüksek',medium:'Orta',low:'Düşük'}[t.priority]}</span><button class="delete" aria-label="Görevi sil">×</button></li>`).join('');
  visible.forEach((t, i) => $('#taskList').children[i].querySelector('.task-title').textContent = t.title);
  $('#emptyState').hidden = visible.length !== 0;
  const done = tasks.filter(t => t.done).length;
  const percentage = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $('#totalCount').textContent = tasks.length;
  $('#doneCount').textContent = done;
  $('#pendingCount').textContent = tasks.length - done;
  $('#progressText').textContent = `%${percentage} ilerleme`;
  $('#score').textContent = `${percentage}%`;
}

$('#newTaskButton').onclick = () => { $('#taskDialog').showModal(); $('#taskTitle').focus(); };
$('#closeDialog').onclick = () => $('#taskDialog').close();
$('#taskForm').onsubmit = () => { tasks.unshift({id:crypto.randomUUID(),title:$('#taskTitle').value.trim(),priority:$('#taskPriority').value,done:false}); persist(); render(); $('#taskForm').reset(); };
$('#taskList').onclick = (event) => { const row = event.target.closest('.task'); if (!row) return; const index = tasks.findIndex(t => t.id === row.dataset.id); if (event.target.matches('.task-check')) tasks[index].done = event.target.checked; if (event.target.matches('.delete')) tasks.splice(index, 1); persist(); render(); };
document.querySelectorAll('.filter').forEach(button => button.onclick = () => { document.querySelector('.filter.active').classList.remove('active'); button.classList.add('active'); filter = button.dataset.filter; render(); });
$('#quickNote').value = localStorage.getItem('yonetim-note') || '';
let noteTimer; $('#quickNote').oninput = event => { $('#saveState').textContent = 'Kaydediliyor…'; clearTimeout(noteTimer); noteTimer = setTimeout(() => { localStorage.setItem('yonetim-note', event.target.value); $('#saveState').textContent = 'Kaydedildi'; }, 400); };
$('#themeToggle').onclick = () => { document.body.classList.toggle('dark'); const dark = document.body.classList.contains('dark'); localStorage.setItem('yonetim-theme', dark ? 'dark' : 'light'); $('#themeToggle').textContent = dark ? '☀' : '☾'; };
if (localStorage.getItem('yonetim-theme') === 'dark') $('#themeToggle').click();
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    setInterval(() => reg.update(), 60000);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) { $('#updateToast').hidden = false; worker.postMessage('SKIP_WAITING'); }
      });
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}
