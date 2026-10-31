import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { BookOpen, GraduationCap, Search, Upload, Plus, Download, Trash2, Play, LayoutDashboard, Database, CheckCircle2, ChevronRight, X, FileSpreadsheet, RotateCcw } from 'lucide-react';

const UNIVERSITIES = ['UNDAC', 'UNEVHAL', 'UNMSM', 'UNI', 'UNFV'];
const SAMPLE = [
  { id: 'demo-1', universidad: 'UNDAC', curso: 'Historia', pregunta: '¿Cuál es considerada una de las primeras civilizaciones del Perú?', a: 'Chavín', b: 'Inca', c: 'Wari', d: 'Chimú', e: 'Paracas', respuesta: 'A', explicacion: 'Chavín es una de las culturas tempranas más importantes del antiguo Perú.', dificultad: 'Básica' },
  { id: 'demo-2', universidad: 'UNMSM', curso: 'Historia', pregunta: '¿Qué proceso puso fin al dominio español en el Perú?', a: 'La Confederación Perú-Boliviana', b: 'La independencia', c: 'La Guerra del Pacífico', d: 'La reforma borbónica', e: 'La conquista', respuesta: 'B', explicacion: 'La independencia consolidó el fin del dominio colonial español.', dificultad: 'Básica' }
];
const STORAGE_KEY = 'preu-peru-ai-questions-v1';
const letters = ['A','B','C','D','E'];

function readQuestions() {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : SAMPLE; }
  catch { return SAMPLE; }
}
function normalize(row, index) {
  const get = (...keys) => {
    for (const key of keys) {
      const found = Object.keys(row).find(k => k.toLowerCase().trim().replaceAll(' ','_') === key);
      if (found && row[found] !== undefined) return String(row[found]).trim();
    }
    return '';
  };
  const answer = get('respuesta','clave','correcta').toUpperCase().replace(/[^A-E]/g,'').charAt(0);
  return {
    id: 'q-' + Date.now() + '-' + index,
    universidad: (get('universidad','university') || 'UNDAC').toUpperCase(),
    curso: get('curso','asignatura','materia') || 'General',
    pregunta: get('pregunta','enunciado','question'),
    a: get('alternativa_a','alternativa_a_','a','opcion_a','opción_a'),
    b: get('alternativa_b','b','opcion_b','opción_b'),
    c: get('alternativa_c','c','opcion_c','opción_c'),
    d: get('alternativa_d','d','opcion_d','opción_d'),
    e: get('alternativa_e','e','opcion_e','opción_e'),
    respuesta: answer || 'A',
    explicacion: get('explicacion','explicación','fundamento'),
    dificultad: get('dificultad','nivel') || 'Intermedia'
  };
}

export default function App() {
  const [questions, setQuestions] = useState(readQuestions);
  const [university, setUniversity] = useState('UNDAC');
  const [section, setSection] = useState('inicio');
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ universidad:'UNDAC', curso:'Historia', pregunta:'', a:'', b:'', c:'', d:'', e:'', respuesta:'A', explicacion:'', dificultad:'Intermedia' });
  const [quiz, setQuiz] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [chosen, setChosen] = useState({});
  const [finished, setFinished] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(questions)); }, [questions]);

  const universityQuestions = useMemo(() => questions.filter(q => q.universidad === university), [questions, university]);
  const courses = useMemo(() => ['Todos', ...new Set(universityQuestions.map(q => q.curso).filter(Boolean))], [universityQuestions]);
  const visible = universityQuestions.filter(q => (course === 'Todos' || q.curso === course) && (q.pregunta + ' ' + q.curso).toLowerCase().includes(search.toLowerCase()));
  const notify = message => { setNotice(message); window.setTimeout(() => setNotice(''), 3500); };

  function addQuestion(e) {
    e.preventDefault();
    if (!form.pregunta.trim() || !form.a.trim() || !form.b.trim() || !form.c.trim() || !form.d.trim()) { notify('Completa la pregunta y al menos cuatro alternativas.'); return; }
    setQuestions(old => [{...form, id:'q-' + Date.now()}, ...old]);
    setUniversity(form.universidad);
    setForm({...form, pregunta:'', a:'', b:'', c:'', d:'', e:'', explicacion:''});
    setShowForm(false);
    notify('Pregunta guardada correctamente en este equipo.');
  }

  async function importExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {type:'array'});
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
      const imported = rows.map(normalize).filter(q => q.pregunta);
      if (!imported.length) { notify('No se encontraron preguntas. Revisa los encabezados de Excel.'); return; }
      setQuestions(old => [...imported, ...old]);
      notify('Se importaron ' + imported.length + ' preguntas.');
    } catch { notify('No se pudo leer el archivo. Usa Excel .xlsx o .xls.'); }
    event.target.value = '';
  }

  function downloadTemplate() {
    const rows = [{universidad:'UNDAC',curso:'Historia',pregunta:'Escribe aquí la pregunta',alternativa_a:'Alternativa A',alternativa_b:'Alternativa B',alternativa_c:'Alternativa C',alternativa_d:'Alternativa D',alternativa_e:'Alternativa E',respuesta:'A',explicacion:'Explicación de la respuesta',dificultad:'Básica'}];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), 'Preguntas');
    XLSX.writeFile(book, 'Plantilla_Preu_Peru_AI.xlsx');
  }

  function startQuiz() {
    const pool = [...visible].sort(() => Math.random() - .5).slice(0, Math.min(10, visible.length));
    if (!pool.length) { notify('No hay preguntas disponibles para este simulacro.'); return; }
    setQuiz(pool); setQuizIndex(0); setChosen({}); setFinished(false); setSection('simulacro');
  }
  function deleteQuestion(id) {
    if (window.confirm('¿Eliminar esta pregunta?')) { setQuestions(old => old.filter(q => q.id !== id)); notify('Pregunta eliminada.'); }
  }
  const current = quiz[quizIndex];
  const score = quiz.filter((q,i) => chosen[i] === q.respuesta).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><GraduationCap size={25}/></div><div><strong>PreU Perú AI</strong><small>Plataforma de admisión</small></div></div>
      <div className="side-label">MENÚ PRINCIPAL</div>
      <button className={section==='inicio'?'nav active':'nav'} onClick={()=>setSection('inicio')}><LayoutDashboard size={18}/> Inicio</button>
      <button className={section==='banco'?'nav active':'nav'} onClick={()=>setSection('banco')}><Database size={18}/> Banco de preguntas</button>
      <button className={section==='simulacro'?'nav active':'nav'} onClick={startQuiz}><Play size={18}/> Simulacro</button>
      <div className="side-label university-label">UNIVERSIDADES</div>
      {UNIVERSITIES.map(u=><button key={u} className={university===u?'university active-university':'university'} onClick={()=>{setUniversity(u);setSection('banco');setCourse('Todos');}}><span className="uni-icon">{u.slice(0,1)}</span>{u}<ChevronRight size={15}/></button>)}
      <div className="sidebar-bottom"><span className="status-dot"></span> Datos guardados en este equipo</div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><span className="eyebrow">PREPARACIÓN UNIVERSITARIA</span><h1>{section==='inicio'?'Panel principal':section==='banco'?'Banco de preguntas': 'Simulacro de admisión'}</h1></div><div className="top-actions"><span className="device-tag">Versión web · Computadora</span><div className="avatar">P</div></div></header>
      {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}

      {section==='inicio' && <div className="content">
        <section className="welcome"><div><span className="welcome-kicker">BIENVENIDO A TU PREPARACIÓN</span><h2>Tu ingreso a la universidad<br/>comienza con una buena práctica.</h2><p>Organiza tus preguntas, repasa tus cursos y mide tus conocimientos.</p><button className="primary-btn" onClick={()=>setSection('banco')}>Ir al banco de preguntas <ChevronRight size={17}/></button></div><div className="welcome-art"><div className="art-circle"><GraduationCap size={76}/></div><span className="art-star star-one">✦</span><span className="art-star star-two">✧</span></div></section>
        <div className="stats-grid"><div className="stat-card"><span className="stat-icon blue"><BookOpen/></span><div><strong>{questions.length}</strong><small>Preguntas registradas</small></div></div><div className="stat-card"><span className="stat-icon purple"><GraduationCap/></span><div><strong>{UNIVERSITIES.length}</strong><small>Universidades</small></div></div><div className="stat-card"><span className="stat-icon green"><CheckCircle2/></span><div><strong>{new Set(questions.map(q=>q.curso)).size}</strong><small>Cursos disponibles</small></div></div></div>
        <div className="section-heading"><div><h3>Selecciona tu universidad</h3><p>Accede a su banco de preguntas.</p></div></div>
        <div className="university-grid">{UNIVERSITIES.map((u,i)=><button className="university-card" key={u} onClick={()=>{setUniversity(u);setSection('banco');setCourse('Todos');}}><span className={'uni-large tone-'+i}>{u.slice(0,1)}</span><div><strong>{u}</strong><small>{questions.filter(q=>q.universidad===u).length} preguntas</small></div><ChevronRight/></button>)}</div>
        <div className="tip"><FileSpreadsheet size={20}/><div><strong>¿Tienes preguntas en Excel?</strong><p>Importa tu archivo desde el banco de preguntas para ampliar tu contenido.</p></div><button className="text-btn" onClick={()=>setSection('banco')}>Administrar preguntas</button></div>
      </div>}

      {section==='banco' && <div className="content">
        <div className="bank-toolbar"><div><span className="selected-university">{university}</span><p>Administra y consulta las preguntas de esta universidad.</p></div><div className="toolbar-actions"><button className="outline-btn" onClick={downloadTemplate}><Download size={16}/> Plantilla Excel</button><button className="outline-btn" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Importar Excel</button><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={importExcel}/><button className="primary-btn" onClick={()=>{setForm({...form,universidad:university});setShowForm(true);}}><Plus size={17}/> Nueva pregunta</button></div></div>
        <div className="filter-row"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pregunta o curso..."/></div><select value={course} onChange={e=>setCourse(e.target.value)}>{courses.map(c=><option key={c}>{c}</option>)}</select><span className="result-count">{visible.length} preguntas</span></div>
        {showForm && <form className="question-form" onSubmit={addQuestion}><div className="form-title"><h3>Agregar pregunta</h3><button type="button" className="icon-btn" onClick={()=>setShowForm(false)}><X/></button></div><div className="form-grid"><label>Universidad<select value={form.universidad} onChange={e=>setForm({...form,universidad:e.target.value})}>{UNIVERSITIES.map(u=><option key={u}>{u}</option>)}</select></label><label>Curso<input value={form.curso} onChange={e=>setForm({...form,curso:e.target.value})} required/></label><label className="wide">Pregunta<textarea value={form.pregunta} onChange={e=>setForm({...form,pregunta:e.target.value})} required rows="2"/></label>{letters.map(l=><label key={l}>Alternativa {l}<input value={form[l.toLowerCase()]} onChange={e=>setForm({...form,[l.toLowerCase()]:e.target.value})} required={l!=='E'}/></label>)}<label>Respuesta correcta<select value={form.respuesta} onChange={e=>setForm({...form,respuesta:e.target.value})}>{letters.map(l=><option key={l}>{l}</option>)}</select></label><label>Dificultad<select value={form.dificultad} onChange={e=>setForm({...form,dificultad:e.target.value})}><option>Básica</option><option>Intermedia</option><option>Avanzada</option></select></label><label className="wide">Explicación<textarea rows="2" value={form.explicacion} onChange={e=>setForm({...form,explicacion:e.target.value})}/></label></div><button className="primary-btn" type="submit">Guardar pregunta</button></form>}
        <div className="question-list">{visible.map((q,i)=><article className="question-card" key={q.id}><div className="question-top"><span className="question-number">PREGUNTA {i+1}</span><span className="course-tag">{q.curso}</span><button className="delete-btn" onClick={()=>deleteQuestion(q.id)} title="Eliminar pregunta"><Trash2 size={16}/></button></div><h3>{q.pregunta}</h3><div className="options-grid">{letters.filter(l=>q[l.toLowerCase()]).map(l=><div className={'option '+(q.respuesta===l?'correct':'')} key={l}><b>{l}</b><span>{q[l.toLowerCase()]}</span>{q.respuesta===l&&<CheckCircle2 size={15}/>}</div>)}</div>{q.explicacion&&<details className="explanation"><summary>Ver explicación</summary><p>{q.explicacion}</p></details>}</article>)}
        {!visible.length&&<div className="empty-state"><BookOpen size={36}/><h3>No hay preguntas todavía</h3><p>Agrega una pregunta o importa un archivo Excel para comenzar.</p><button className="primary-btn" onClick={()=>{setForm({...form,universidad:university});setShowForm(true);}}>Agregar primera pregunta</button></div>}
        </div>
      </div>}

      {section==='simulacro' && <div className="content quiz-content">{!quiz.length?<div className="empty-state"><Play size={38}/><h3>Prepara tu simulacro</h3><p>Selecciona una universidad y asegúrate de tener preguntas registradas en el banco.</p><button className="primary-btn" onClick={()=>setSection('banco')}>Ir al banco</button></div>:finished?<div className="result-card"><span className="result-medal"><GraduationCap size={40}/></span><span className="eyebrow">RESULTADO DEL SIMULACRO</span><h2>{score} de {quiz.length} respuestas correctas</h2><p>{Math.round(score/quiz.length*100)}% de aciertos · {university}</p><button className="primary-btn" onClick={()=>setSection('banco')}>Volver al banco</button><button className="outline-btn" onClick={startQuiz}><RotateCcw size={16}/> Repetir simulacro</button></div>:<div className="quiz-card"><div className="quiz-progress"><span>Pregunta {quizIndex+1} de {quiz.length}</span><span>{university} · {quiz[quizIndex].curso}</span></div><div className="progress-track"><div style={{width:((quizIndex+1)/quiz.length*100)+'%'}}/></div><h2>{current.pregunta}</h2><div className="quiz-options">{letters.filter(l=>current[l.toLowerCase()]).map(l=><button key={l} disabled={chosen[quizIndex]!==undefined} className={'quiz-option '+(chosen[quizIndex]===l?'chosen':'')} onClick={()=>setChosen(old=>({...old,[quizIndex]:l}))}><b>{l}</b>{current[l.toLowerCase()]}</button>)}</div>{chosen[quizIndex]&&<div className="answer-feedback"><strong>{chosen[quizIndex]===current.respuesta?'¡Respuesta correcta!':'Respuesta registrada'}</strong>{current.explicacion&&<p>{current.explicacion}</p>}</div>}<div className="quiz-footer"><button className="outline-btn" onClick={()=>setSection('banco')}>Salir</button><button className="primary-btn" disabled={!chosen[quizIndex]} onClick={()=>{if(quizIndex+1===quiz.length)setFinished(true);else setQuizIndex(i=>i+1);}}>{quizIndex+1===quiz.length?'Ver resultado':'Siguiente pregunta'} <ChevronRight size={16}/></button></div></div>}</div>}
      <footer className="footer">PreU Perú AI · Plataforma de preparación universitaria</footer>
    </main>
  </div>;
}
