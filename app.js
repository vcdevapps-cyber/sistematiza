/**
 * SISTEMATIZA - Lógica de Sincronização e Acervo
 * Sérgio Araújo - 2025
 */

// 1. INICIALIZAÇÃO DOS BANCOS
const localDB = new PouchDB('sistematiza_db_v1');

/** * AJUSTE NECESSÁRIO:
 * Substitua 'SUA_SENHA' pela senha do seu Docker.
 * Note o novo nome do banco: sistematiza_acervo
 */
const remoteDB = new PouchDB('http://admin:j1junior@127.0.0.1:5984/sistematiza_acervo');

let currentFilter = 'all';
const syncIcon = document.getElementById('sync-icon');

// 2. SINCRONIZAÇÃO
localDB.sync(remoteDB, {
    live: true,
    retry: true
}).on('change', () => {
    render();
}).on('active', () => {
    updateSyncUI('syncing');
}).on('paused', () => {
    updateSyncUI('online');
}).on('error', (err) => {
    updateSyncUI('error');
    console.error("Falha na sincronia do Sistematiza:", err);
});

// 3. UI DE STATUS (NUVEM)
function updateSyncUI(status) {
    if (!syncIcon) return;
    lucide.createIcons();

    switch (status) {
        case 'syncing':
            syncIcon.setAttribute('data-lucide', 'cloud-lightning');
            syncIcon.className = 'w-5 h-5 text-blue-500 animate-pulse';
            break;
        case 'online':
            syncIcon.setAttribute('data-lucide', 'cloud-check');
            syncIcon.className = 'w-5 h-5 text-emerald-500 drop-shadow-sm';
            break;
        case 'error':
            syncIcon.setAttribute('data-lucide', 'cloud-off');
            syncIcon.className = 'w-5 h-5 text-red-500';
            break;
    }
    lucide.createIcons();
}

// 4. RENDERIZAÇÃO
async function render() {
    try {
        const result = await localDB.allDocs({ include_docs: true, descending: true });
        let notes = result.rows.map(row => row.doc);

        if (currentFilter !== 'all') {
            notes = notes.filter(n => n.category === currentFilter);
        }

        const container = document.getElementById('notesContainer');
        if (notes.length === 0) {
            container.innerHTML = `<div class="col-span-full py-20 text-center text-slate-300 font-medium italic">Seu acervo Sistematiza está vazio.</div>`;
        } else {
            container.innerHTML = notes.map(note => `
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group transition hover:shadow-xl">
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest italic">${note.category}</span>
                        <button onclick="deleteNote('${note._id}', '${note._rev}')" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">${note.content}</p>
                    <div class="mt-4 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                        <span>${note.date}</span>
                    </div>
                </div>
            `).join('');
        }
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

// 5. SALVAR E EXCLUIR
async function saveNote() {
    const content = document.getElementById('noteContent').value;
    if (!content) return;

    const note = {
        _id: new Date().toISOString(),
        content,
        category: document.getElementById('category').value,
        tags: document.getElementById('tags').value.split(',').map(t => t.trim()),
        date: new Date().toLocaleString('pt-BR')
    };

    try {
        await localDB.put(note);
        document.getElementById('noteContent').value = '';
        document.getElementById('tags').value = '';
        closeModal();
        render();
    } catch (err) { alert("Erro ao salvar no arquivo."); }
}

async function deleteNote(id, rev) {
    if (confirm('Eliminar este registro do Sistematiza?')) {
        await localDB.remove(id, rev);
        render();
    }
}

// 6. EXPORTAÇÕES
async function exportTXTReport() {
    const res = await localDB.allDocs({ include_docs: true });
    const notes = res.rows.map(r => r.doc);
    let report = "SISTEMATIZA - RELATÓRIO\n" + new Date().toLocaleString() + "\n========================\n\n";
    notes.forEach(n => { report += `[${n.date}] [${n.category}]\n${n.content}\n\n-------------------\n`; });
    const blob = new Blob([report], {type: 'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `sistematiza_txt.txt`; a.click();
}

async function exportFullBackup() {
    const res = await localDB.allDocs({ include_docs: true });
    const data = JSON.stringify(res.rows.map(r => r.doc));
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `sistematiza_backup.json`; a.click();
}

// 7. HELPERS DE UI
function filterNotes(cat, el) { 
    currentFilter = cat; 
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active-link')); 
    el.classList.add('active-link'); 
    document.getElementById('acervoView').classList.remove('hidden'); 
    document.getElementById('aboutView').classList.add('hidden'); 
    document.getElementById('viewTitle').innerText = (cat === 'all') ? 'Acervo' : cat; 
    render(); 
}

function showAbout(el) { 
    document.getElementById('acervoView').classList.add('hidden'); 
    document.getElementById('aboutView').classList.remove('hidden'); 
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active-link')); 
    el.classList.add('active-link'); 
}

function saveStyle() { localStorage.setItem('sistematiza_style', document.getElementById('styleGuide').value); closeStyleModal(); }
function openModal() { document.getElementById('modal').classList.replace('hidden', 'flex'); lucide.createIcons(); }
function closeModal() { document.getElementById('modal').classList.replace('flex', 'hidden'); }
function openStyleModal() { document.getElementById('styleModal').classList.replace('hidden', 'flex'); }
function closeStyleModal() { document.getElementById('styleModal').classList.replace('flex', 'hidden'); }

document.addEventListener('DOMContentLoaded', () => { 
    render(); 
    document.getElementById('styleGuide').value = localStorage.getItem('sistematiza_style') || '';
    lucide.createIcons(); 
});
