
 if(sessionStorage.getItem('loggedIn') !== 'true'){
    window.location.href = "login.html";
  }
document.getElementById('logoutBtn').addEventListener('click', ()=>{
    sessionStorage.removeItem('loggedIn');
    window.location.href = "login.html";
  });

  function calcFine(dueDate){
  if(!dueDate) return 0;
  const todayISO = new Date().toISOString().slice(0,10);
  const daysLate = daysBetweenDates(dueDate, todayISO);
  return daysLate > 0 ? daysLate * FINE_PER_DAY : 0;
}

function searchBorrower(){
  const name = $('#borrowerSearchInput').value.trim().toLowerCase();
  const resultDiv = $('#borrowerResult');
  resultDiv.innerHTML = '';

  if(!name) return;

  const matches = BOOKS.filter(b => 
    (b.borrower||'').toLowerCase() === name && (b.status==='Issued' || b.status==='Overdue')
  );

  if(matches.length === 0){
    resultDiv.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No records found for this Student.</p>`;
    return;
  }

  let totalFine = 0;
  matches.forEach(b => totalFine += calcFine(b.dueDate));

  let html = `
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Student ID : ${matches[0].borrower}</h3>
    <p class="text-gray-600 dark:text-gray-300">Books Issued: ${matches.length}</p>
    <p class="text-gray-600 dark:text-gray-300">Total Fine: ₹${totalFine}</p>
    <div class="overflow-x-auto">
      <table class="min-w-full mt-3 border border-gray-300 dark:border-gray-700 text-sm">
        <thead class="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th class="px-3 py-2 text-left dark:text-white">Title</th>
            <th class="px-3 py-2 dark:text-white">Due Date</th>
            <th class="px-3 py-2 dark:text-white">Fine</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
  `;

  matches.forEach(b=>{
    html += `
      <tr>
        <td class="px-3 py-2 dark:text-white">${b.title}</td>
        <td class="px-3 py-2 dark:text-white">${isoToDisplay(b.dueDate)}</td>
        <td class="px-3 py-2 dark:text-white">₹${calcFine(b.dueDate)}</td>
      </tr>`;
  });

  html += `</tbody></table></div>`;
  resultDiv.innerHTML = html;
}

  // ---------- Utilities & Storage ----------
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const LS_BOOKS = 'lms_books_v2';
  const LS_FINES  = 'lms_fines_v2';
  const FINE_PER_DAY = 5; // ₹5 per overdue day

  function addDaysISO(n){
    const d = new Date(); d.setDate(d.getDate()+n);
    return d.toISOString().slice(0,10); // yyyy-mm-dd
  }
  function isoToDisplay(iso){ return iso ? new Date(iso).toLocaleDateString() : '-'; }
  function daysBetweenDates(d1iso, d2iso){ // d2 - d1 in days (integer)
    const d1 = new Date(d1iso).setHours(0,0,0,0);
    const d2 = new Date(d2iso).setHours(0,0,0,0);
    return Math.floor((d2 - d1) / (1000*60*60*24));
  }

  // Sample init data
  const sample = [
    {id:crypto.randomUUID(), title:'The Alchemist', author:'Paulo Coelho', isbn:'978-0062315007', category:'Fiction', status:'Available', borrower:null, dueDate:null, cover:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop', createdAt:Date.now()},
    {id:crypto.randomUUID(), title:'Sapiens', author:'Yuval Noah Harari', isbn:'978-0062316097', category:'History', status:'Issued', borrower:'Alex', dueDate:addDaysISO(7), cover:'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop', createdAt:Date.now()-200000},
    {id:crypto.randomUUID(), title:'Dune', author:'Frank Herbert', isbn:'978-0441172719', category:'Science', status:'Reserved', borrower:'Maya', dueDate:null, cover:'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop', createdAt:Date.now()-400000},
  ];

  function loadBooks(){
    const raw = localStorage.getItem(LS_BOOKS);
    if(!raw){ localStorage.setItem(LS_BOOKS, JSON.stringify(sample)); }
    return JSON.parse(localStorage.getItem(LS_BOOKS) || '[]');
  }
  function saveBooks(b){ localStorage.setItem(LS_BOOKS, JSON.stringify(b)); }
  function loadFines(){ return JSON.parse(localStorage.getItem(LS_FINES) || '[]'); }
  function saveFineRecord(rec){
    const arr = loadFines(); arr.push(rec); localStorage.setItem(LS_FINES, JSON.stringify(arr));
  }
  function totalFinesCollected(){ return loadFines().reduce((s,r)=>s+(r.amount||0),0); }

  let BOOKS = loadBooks();
  let currentBookId = null;

  // ---------- Theme ----------
  if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
  $('#themeToggle').addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });

  // Sidebar toggle
  $('#sidebarToggle').addEventListener('click', ()=>$('#sidebar').classList.toggle('open'));

  // ---------- Rendering Helpers ----------
  function statusBadge(s){
    const map = {Available:'green', Issued:'red', Reserved:'yellow', Overdue:'yellow'};
    const c = map[s] || 'gray';
    return `<span class="bg-${c}-500 text-white text-xs px-2 py-1 rounded">${s}</span>`;
  }

  function renderStats(){
    updateOverdues();
    const total = BOOKS.length;
    const available = BOOKS.filter(b=>b.status==='Available').length;
    const issued = BOOKS.filter(b=>b.status==='Issued').length;
    const overdue = BOOKS.filter(b=>b.status==='Overdue').length;
    $('#statTotal').textContent = total;
    $('#statAvailable').textContent = available;
    $('#statIssued').textContent = issued;
    $('#statOverdue').textContent = overdue;
    $('#statFines').textContent = `₹${totalFinesCollected()}`;
  }

  function renderAnalytics(){
    const cats = ['Fiction','Non-Fiction','Science','Technology','History','Other'];
    const counts = Object.fromEntries(cats.map(c=>[c,0]));
    BOOKS.forEach(b=>{ counts[b.category] = (counts[b.category]||0)+1; });
    const total = Math.max(1, BOOKS.length);
    const container = $('#analyticsBars'); container.innerHTML='';
    cats.forEach(c=>{
      const pct = Math.round((counts[c]/total)*100);
      container.insertAdjacentHTML('beforeend', `
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-300">${c}</span>
          <div class="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-2">
            <div class="h-2 rounded-full bg-primary-600 chart-bar" style="width:${pct}%"></div>
          </div>
          <span class="text-sm font-medium text-gray-800 dark:text-white">${pct}%</span>
        </div>
      `);
    });
  }

  function renderRecent(){
    const list = [...BOOKS].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,5);
    const root = $('#recentList');
    root.innerHTML = list.map(b=>`
      <div class="flex items-center space-x-4">
        <img src="${b.cover||'https://via.placeholder.com/64x96?text=Book'}" alt="cover" class="w-12 h-16 object-cover rounded">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800 dark:text-white">${b.title}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">${b.author}</p>
          <div class="flex items-center mt-1">
            ${statusBadge(b.status)}
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">ISBN: ${b.isbn}</span>
          </div>
        </div>
        <button class="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded" data-view="${b.id}"><i class="fas fa-eye"></i></button>
      </div>
    `).join('');
    root.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click', ()=>openView(btn.dataset.view)));
  }

  function matchesFilters(b){
    const q = $('#searchInput').value.trim().toLowerCase();
    const cat = $('#filterCategory').value;
    const st = $('#filterStatus').value;
    const textOk = !q || [b.title,b.author,b.isbn].some(x=>String(x).toLowerCase().includes(q));
    const catOk = !cat || b.category===cat;
    const stOk = !st || b.status===st;
    return textOk && catOk && stOk;
  }

  function renderGrid(){
    const root = $('#booksGrid'); root.innerHTML = '';
    const catColorMap = {Fiction:'blue','Non-Fiction':'emerald',Science:'purple',Technology:'red',History:'green',Other:'gray'};
    BOOKS.filter(matchesFilters).forEach(b=>{
      const catColor = catColorMap[b.category] || 'gray';
      root.insertAdjacentHTML('beforeend', `
        <div class="book-card bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden  ">
          <div class="relative">
            <img src="${b.cover||'https://via.placeholder.com/400x240?text=Book+Cover'}" alt="Cover of ${b.title}" class="w-full h-48 object-cover">
            <div class="absolute top-2 right-2">${statusBadge(b.status)}</div>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg text-gray-800 dark:text-white mb-1">${b.title}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">${b.author}</p>
            <div class="flex justify-between items-center mb-3">
              <span class="text-xs text-gray-500 dark:text-gray-400">ISBN: ${b.isbn}</span>
              <span class="text-xs bg-${catColor}-100 dark:bg-${catColor}-900/20 text-${catColor}-800 dark:text-${catColor}-300 px-2 py-1 rounded">${b.category}</span>
            </div>
            <div class="flex space-x-2">
              <button class="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded text-sm" data-view="${b.id}">
                <i class="fas fa-eye mr-1"></i> View
              </button>
              ${b.status==='Available'
                ? `<button class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm" data-issue="${b.id}"><i class="fas fa-exchange-alt mr-1"></i> Issue</button>`
                : `<button class="flex-1 bg-gray-400 text-white py-2 rounded text-sm ${b.status==='Issued'?'':'cursor-not-allowed'}" ${b.status==='Issued'?'data-return="'+b.id+'"':''} ${b.status==='Issued'?'':'disabled'}><i class="fas fa-undo mr-1"></i> ${b.status==='Issued'?'Return':'Busy'}</button>`
              }
            </div>
          </div>
        </div>
      `);
    });
    root.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click', ()=>openView(btn.dataset.view)));
    root.querySelectorAll('[data-issue]').forEach(btn=>btn.addEventListener('click', ()=>openIssueById(btn.dataset.issue)));
    root.querySelectorAll('[data-return]').forEach(btn=>btn.addEventListener('click', ()=>returnById(btn.dataset.return)));
  }

  function renderIssuedList(){
    const root = $('#issuedList');
    const list = BOOKS.filter(b=>['Issued','Reserved','Overdue'].includes(b.status));
    if(!list.length){ root.innerHTML = `<div class="p-6 text-gray-500 dark:text-gray-400">No issued or reserved books.</div>`; return; }
    root.innerHTML = '';
    list.forEach(b=>{
      root.insertAdjacentHTML('beforeend', `
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img src="${b.cover||'https://via.placeholder.com/64x96'}" class="w-10 h-14 object-cover rounded">
            <div>
              <div class="font-semibold text-gray-800 dark:text-white">${b.title} <span class="ml-2">${statusBadge(b.status)}</span></div>
              <div class="text-sm text-gray-600 dark:text-gray-300">ISBN: ${b.isbn} • Borrower: ${b.borrower||'-'}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Due: ${isoToDisplay(b.dueDate)}</div>
              ${b.status==='Overdue' && b.dueDate ? `<div class="text-xs text-red-500 dark:text-red-300">Overdue by ${Math.max(0, daysBetweenDates(b.dueDate, new Date().toISOString().slice(0,10)))} days</div>` : ''}
            </div>
          </div>
          <div class="space-x-2">
            ${b.status!=='Issued' ? '' : `<button class="px-3 py-1 rounded bg-blue-600 text-white" data-return="${b.id}"><i class="fas fa-undo mr-1"></i>Return</button>`}
            <button class="px-3 py-1 rounded bg-primary-600 text-white" data-view="${b.id}"><i class="fas fa-eye mr-1"></i>View</button>
          </div>
        </div>
      `);
    });
    root.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click', ()=>openView(btn.dataset.view)));
    root.querySelectorAll('[data-return]').forEach(btn=>btn.addEventListener('click', ()=>returnById(btn.dataset.return)));
  }

  // ---------- Business logic ----------
  function upsertBook(data){
    if(data.id){
      BOOKS = BOOKS.map(b=>b.id===data.id?{...b, ...data}:b);
    } else {
      data.id = crypto.randomUUID();
      data.createdAt = Date.now();
      data.status = 'Available';
      data.borrower = null;
      data.dueDate = null;
      BOOKS.unshift(data);
    }
    saveBooks(BOOKS);
    refreshUI();
  }

  function deleteBook(id){
    BOOKS = BOOKS.filter(b=>b.id!==id);
    saveBooks(BOOKS);
    refreshUI();
  }

  function markIssued(id, borrower, dueIso){
    BOOKS = BOOKS.map(b=> b.id===id ? {...b, status:'Issued', borrower, dueDate: dueIso} : b);
    saveBooks(BOOKS);
    refreshUI();
  }

  function markReserved(id, borrower='(Reservation)'){
    BOOKS = BOOKS.map(b=> b.id===id ? {...b, status:'Reserved', borrower, dueDate:null} : b);
    saveBooks(BOOKS);
    refreshUI();
  }

  function markReturned(id){
    BOOKS = BOOKS.map(b=> b.id===id ? {...b, status:'Available', borrower:null, dueDate:null} : b);
    saveBooks(BOOKS);
    refreshUI();
  }

  // Overdue update
  function updateOverdues(){
    const todayIso = new Date().toISOString().slice(0,10);
    BOOKS = BOOKS.map(b=>{
      if(b.status==='Issued' && b.dueDate){
        const diff = daysBetweenDates(b.dueDate, todayIso);
        if(diff>0) return {...b, status:'Overdue'};
      }
      return b;
    });
  }

  // Calculate fine for a book (based on dueDate vs return date)
  function calculateFine(book, returnIso){
    if(!book.dueDate) return 0;
    const overdueDays = Math.max(0, daysBetweenDates(book.dueDate, returnIso));
    return overdueDays * FINE_PER_DAY;
  }

  // ---------- Modals & forms ----------
  function openModal(sel){ const el=$(sel); el.classList.remove('hidden'); el.classList.add('flex'); }
  function closeModal(sel){ const el=$(sel); el.classList.add('hidden'); el.classList.remove('flex'); }
  document.addEventListener('click', (e)=>{
    const close = e.target.closest('[data-close]');
    if(close) closeModal(close.getAttribute('data-close'));
    if(e.target.classList.contains('modal')) e.target.classList.add('hidden');
  });

  // Add/Edit setup
  $('#btnOpenAdd')?.addEventListener('click', openAdd);
  $('#qaAdd')?.addEventListener('click', openAdd);
  function openAdd(){
    $('#modalBookTitle').textContent = 'Add Book';
    $('#bookId').value = '';
    $('#formBook').reset();
    openModal('#modalBook');
  }
  function openEdit(book){
    $('#modalBookTitle').textContent = 'Edit Book';
    $('#bookId').value = book.id;
    $('#bookTitle').value = book.title;
    $('#bookAuthor').value = book.author;
    $('#bookIsbn').value = book.isbn;
    $('#bookCategory').value = book.category;
    $('#bookCover').value = book.cover || '';
    openModal('#modalBook');
  }
  $('#formBook').addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = { id: $('#bookId').value || undefined, title: $('#bookTitle').value.trim(), author: $('#bookAuthor').value.trim(), isbn: $('#bookIsbn').value.trim(), category: $('#bookCategory').value, cover: $('#bookCover').value.trim() };
    if(!data.title||!data.author||!data.isbn){ alert('Fill required fields'); return; }
    upsertBook(data);
    closeModal('#modalBook');
  });

  // View modal
  function openView(id){
    currentBookId = id;
    const b = BOOKS.find(x=>x.id===id);
    const info = `
      <div class="flex gap-4">
        <img src="${b.cover||'https://via.placeholder.com/120x160'}" class="w-24 h-32 object-cover rounded">
        <div>
          <div class="text-lg font-semibold text-gray-800 dark:text-white">${b.title}</div>
          <div class="text-gray-600 dark:text-gray-300">${b.author}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">ISBN: ${b.isbn}</div>
          <div class="mt-1">${statusBadge(b.status)} <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">Category: ${b.category}</span></div>
          <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Borrower: ${b.borrower||'-'} | Due: ${isoToDisplay(b.dueDate)}</div>
          ${b.status==='Overdue' && b.dueDate ? `<div class="mt-1 text-sm text-red-500">Overdue by ${daysBetweenDates(b.dueDate, new Date().toISOString().slice(0,10))} days</div>` : ''}
        </div>
      </div>
    `;
    $('#viewContent').innerHTML = info;

    $('#btnIssue').disabled = !(b.status==='Available');
    $('#btnReserve').disabled = !(b.status==='Available' || b.status==='Issued');
    $('#btnReturn').disabled = !(b.status==='Issued' || b.status==='Overdue');

    openModal('#modalView');

    $('#btnIssue').onclick = ()=> openIssuePrefill(b);
    $('#btnReserve').onclick = ()=> { const name = prompt('Reserve under name:'); if(name){ markReserved(b.id, name); closeModal('#modalView'); } };
    $('#btnReturn').onclick = ()=> { openReturnPrefill(b); };
    $('#btnEdit').onclick = ()=> { openEdit(b); };
    $('#btnDelete').onclick = ()=> { if(confirm('Delete this book?')){ deleteBook(b.id); closeModal('#modalView'); } };
  }

  // ---------- Issue flow with due date ----------
  $('#qaIssue').addEventListener('click', ()=>openModal('#modalIssue'));
  function openIssueById(id){
    const b = BOOKS.find(x=>x.id===id);
    if(!b || b.status!=='Available'){ alert('Book not available to issue.'); return; }
    openIssuePrefill(b);
  }
  function openIssuePrefill(book){
    $('#issueIsbn').value = book.isbn;
    $('#issueUser').value = '';
    // default due date 14 days from today
    $('#issueDueDate').value = addDaysISO(14);
    openModal('#modalIssue');
  }
  $('#formIssue').addEventListener('submit', (e)=>{
    e.preventDefault();
    const isbn = $('#issueIsbn').value.trim();
    const user = $('#issueUser').value.trim();
    const dueIso = $('#issueDueDate').value;
    const book = BOOKS.find(b=>b.isbn===isbn);
    if(!book){ alert('No book with this ISBN'); return; }
    if(book.status!=='Available'){ alert('Book not available'); return; }
    if(!user || !dueIso){ alert('Fill borrower and due date'); return; }
    markIssued(book.id, user, dueIso);
    closeModal('#modalIssue');
    e.target.reset();
  });

  // ---------- Return flow & fine ----------
  $('#qaReturn').addEventListener('click', ()=>openModal('#modalReturn'));
  function openReturnPrefill(book){
    $('#returnIsbn').value = book.isbn;
    // show calculated fine
    const fine = calculateFine(book, new Date().toISOString().slice(0,10));
    $('#calculatedFine').innerHTML = fine>0 ? `<div class="text-sm text-red-600">Calculated fine if returned today: ₹${fine} (${Math.max(0, daysBetweenDates(book.dueDate, new Date().toISOString().slice(0,10)))} days overdue)</div>` : `<div class="text-sm text-green-600">No fine (on or before due date)</div>`;
    openModal('#modalReturn');
  }

  function returnById(id){
    const book = BOOKS.find(b=>b.id===id);
    if(!book || !['Issued','Overdue'].includes(book.status)){ alert('This book is not issued'); return; }
    const returnIso = new Date().toISOString().slice(0,10);
    const fine = calculateFine(book, returnIso);
    if(fine>0){
      // record fine
      saveFineRecord({id:crypto.randomUUID(), bookId:book.id, isbn:book.isbn, borrower:book.borrower||'(unknown)', amount:fine, date:returnIso});
      alert(`Book returned. Fine collected: ₹${fine}`);
    } else {
      alert('Book returned. No fine.');
    }
    markReturned(book.id);
  }

  $('#formReturn').addEventListener('submit', (e)=>{
    e.preventDefault();
    const isbn = $('#returnIsbn').value.trim();
    const book = BOOKS.find(b=>b.isbn===isbn);
    if(!book){ alert('No book found with this ISBN'); return; }
    if(!['Issued','Overdue'].includes(book.status)){ alert('This book is not currently issued'); return; }
    const returnIso = new Date().toISOString().slice(0,10);
    const fine = calculateFine(book, returnIso);
    if(fine>0){ saveFineRecord({id:crypto.randomUUID(), bookId:book.id, isbn:book.isbn, borrower:book.borrower||'(unknown)', amount:fine, date:returnIso}); alert(`Fine ₹${fine} collected.`); }
    else alert('Returned. No fine.');
    markReturned(book.id);
    closeModal('#modalReturn');
    e.target.reset();
  });

  // Quick open modals from grid
  $('#booksGrid').addEventListener('click', ()=>{}); // delegated earlier after renderGrid

  // ---------- Filters ----------
  $('#btnSearch').addEventListener('click', renderGrid);
  $('#searchInput').addEventListener('input', renderGrid);
  $('#filterCategory').addEventListener('change', renderGrid);
  $('#filterStatus').addEventListener('change', renderGrid);

  // ---------- Refresh UI ----------
  function refreshUI(){
    updateOverdues();
    saveBooks(BOOKS);
    renderStats();
    renderAnalytics();
    renderRecent();
    renderGrid();
    renderIssuedList();
  }

  // ---------- Init ----------
  refreshUI();

  // Expose helpers for console testing
  window.LMS = {BOOKS, refreshUI, loadBooks, loadFines:()=>loadFines(), calculateFine};

  // Instant search as you type
$('#searchInput').addEventListener('input', renderGrid);

// Also work on Enter key
$('#searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    renderGrid();
  }
});

