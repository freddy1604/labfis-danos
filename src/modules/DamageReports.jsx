import {useState} from 'react'
import {ShieldCheck,TriangleAlert,Copy,Check,Search,Send,Paperclip,X} from 'lucide-react'
import {supabase,isConfigured} from '../lib/supabase'
import {LABS,URGENCIES,DESCRIPTION_MAX,MAX_FILE_MB,validateReport,validateFile,normalizeCode,statusInfo,fileExtension} from './damageRules'
import './DamageReports.css'

const EVIDENCE_BUCKET='damage-evidence'
const emptyForm={labKey:'',resource:'',urgency:'Media',description:''}

function newFileId(){
  return (globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,10)}`)
}
function formatDate(iso){
  try{return new Date(iso).toLocaleString('es-EC',{dateStyle:'short',timeStyle:'short'})}catch{return iso}
}

export default function DamageReports(){
  const [view,setView]=useState('report') // report | confirm | track
  const [form,setForm]=useState(emptyForm)
  const [errors,setErrors]=useState({})
  const [file,setFile]=useState(null)
  const [fileError,setFileError]=useState('')
  const [submitting,setSubmitting]=useState(false)
  const [submitError,setSubmitError]=useState('')
  const [createdCode,setCreatedCode]=useState('')
  const [copied,setCopied]=useState(false)
  const [codeInput,setCodeInput]=useState('')
  const [trackLoading,setTrackLoading]=useState(false)
  const [trackError,setTrackError]=useState('')
  const [result,setResult]=useState(null)

  const resources=form.labKey?LABS[form.labKey].resources:[]
  const set=(patch)=>setForm(f=>({...f,...patch}))

  function onLabChange(labKey){ set({labKey,resource:''}); setErrors(e=>({...e,lab:undefined,resource:undefined})) }

  function onFileChange(e){
    const f=e.target.files?.[0]; if(!f)return
    const err=validateFile(f)
    if(err){setFile(null);setFileError(err);e.target.value='';return}
    setFileError('');setFile(f)
  }
  function clearFile(){setFile(null);setFileError('')}

  async function submit(e){
    e.preventDefault(); setSubmitError('')
    const errs=validateReport(form); setErrors(errs)
    if(Object.keys(errs).length)return
    if(!supabase){setSubmitError('Supabase no está configurado: revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.');return}
    setSubmitting(true)
    try{
      let evidencePath=null
      if(file){
        evidencePath=`${newFileId()}.${fileExtension(file)}`
        const {error:upErr}=await supabase.storage.from(EVIDENCE_BUCKET).upload(evidencePath,file,{contentType:file.type,upsert:false})
        if(upErr)throw new Error('No se pudo subir la evidencia ('+upErr.message+'). Quita el archivo para enviar el reporte sin evidencia.')
      }
      const {data,error}=await supabase.rpc('create_damage_report',{
        p_lab_key:form.labKey,p_resource:form.resource,p_urgency:form.urgency,p_description:form.description.trim(),p_evidence_path:evidencePath})
      if(error)throw error
      const row=Array.isArray(data)?data[0]:data
      if(!row?.tracking_code)throw new Error('Respuesta inesperada del servidor.')
      setCreatedCode(row.tracking_code);setCopied(false)
      setForm(emptyForm);setErrors({});clearFile()
      setView('confirm')
    }catch(err){
      setSubmitError('No se pudo registrar el reporte: '+(err?.message||String(err)))
    }finally{setSubmitting(false)}
  }

  async function copyCode(){
    try{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(createdCode)
      else{const t=document.createElement('textarea');t.value=createdCode;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t)}
      setCopied(true);setTimeout(()=>setCopied(false),2200)
    }catch{setSubmitError('No se pudo copiar automáticamente. Selecciona el código y cópialo manualmente.')}
  }

  async function lookup(raw){
    const code=normalizeCode(raw)
    setTrackError('');setResult(null)
    if(!code){setTrackError('Por favor, ingrese un código de seguimiento para realizar la búsqueda.');return}
    if(!supabase){setTrackError('Supabase no está configurado: no se puede consultar.');return}
    setTrackLoading(true)
    const {data,error}=await supabase.rpc('get_damage_report',{p_code:code})
    setTrackLoading(false)
    if(error){setTrackError('Error al consultar: '+error.message);return}
    if(!data||!data.length){setTrackError(`No se encontró ningún reporte asociado al código "${code}". Verifica que esté bien escrito.`);return}
    setResult(data[0])
  }

  const info=result?statusInfo(result.status):null

  return <div className="module-page dr">
    <div className="eyebrow">MÓDULO 03 · SIGELAB</div>
    <h2>Reporte de daños</h2>
    <p className="muted">Comunica fallas en equipos o instalaciones sin iniciar sesión y haz seguimiento con tu código.</p>
    {!isConfigured&&<div className="notice"><strong>Supabase no está configurado.</strong> Puedes ver el formulario, pero el envío y la consulta están deshabilitados hasta definir <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</div>}

    <div className="dr-tabs" role="tablist">
      <button role="tab" aria-selected={view!=='track'} className={view!=='track'?'active':''} onClick={()=>setView('report')}>Reportar un daño</button>
      <button role="tab" aria-selected={view==='track'} className={view==='track'?'active':''} onClick={()=>setView('track')}><Search size={15}/> Consultar estado</button>
    </div>

    {view==='report'&&<section className="panel dr-panel">
      <div className="dr-privacy"><ShieldCheck size={20}/><div><b>Reporte 100% anónimo (HU-01)</b><span>No se solicita inicio de sesión ni se guarda tu identidad.</span></div></div>
      <form onSubmit={submit} noValidate>
        <fieldset className="dr-card"><legend>1. Ubicación y recurso</legend>
          <label>Laboratorio afectado *
            <select value={form.labKey} onChange={e=>onLabChange(e.target.value)} aria-invalid={!!errors.lab}>
              <option value="">Seleccione un laboratorio...</option>
              {Object.entries(LABS).map(([k,l])=><option key={k} value={k}>{l.label}</option>)}
            </select>
            {errors.lab&&<span className="dr-err" role="alert">{errors.lab}</span>}
          </label>
          <label>Recurso o equipo *
            <select value={form.resource} disabled={!form.labKey} onChange={e=>{set({resource:e.target.value});setErrors(x=>({...x,resource:undefined}))}} aria-invalid={!!errors.resource}>
              <option value="">{form.labKey?'Seleccione el recurso o equipo...':'Primero seleccione un laboratorio...'}</option>
              {resources.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            {errors.resource&&<span className="dr-err" role="alert">{errors.resource}</span>}
          </label>
        </fieldset>

        <fieldset className="dr-card"><legend>2. Urgencia percibida</legend>
          <div className="dr-urg">
            {URGENCIES.map(u=><label key={u.value} className={'dr-urg-opt u-'+u.value+(form.urgency===u.value?' on':'')}>
              <input type="radio" name="urgency" value={u.value} checked={form.urgency===u.value} onChange={()=>set({urgency:u.value})}/>
              <b>{u.value}</b><small>{u.hint}</small>
            </label>)}
          </div>
          {form.urgency==='Crítica'&&<div className="dr-alert" role="alert"><TriangleAlert size={20}/><div><b>¡Precaución de seguridad inmediata!</b><span>Si detectas chispas, olor a quemado o cables expuestos, aléjate del equipo y avisa de inmediato al docente o encargado.</span></div></div>}
        </fieldset>

        <fieldset className="dr-card"><legend>3. Detalle y evidencia</legend>
          <label>Descripción del daño *
            <textarea rows="3" maxLength={DESCRIPTION_MAX} value={form.description} placeholder="Describe qué ocurre con el equipo o instalación (mínimo 10 caracteres)..." onChange={e=>{set({description:e.target.value});setErrors(x=>({...x,description:undefined}))}} aria-invalid={!!errors.description}/>
            <span className={'dr-count'+(form.description.length>=450?' warn':'')}>{form.description.length} / {DESCRIPTION_MAX}</span>
            {errors.description&&<span className="dr-err" role="alert">{errors.description}</span>}
          </label>
          <div className="dr-file">
            <span className="dr-file-title">Evidencia fotográfica <small>(opcional · JPG, PNG o PDF · máx. {MAX_FILE_MB} MB)</small></span>
            <label className="dr-drop"><Paperclip size={18}/> Toca para adjuntar foto o PDF
              <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={onFileChange} hidden/>
            </label>
            {file&&<div className="dr-pill"><span>{file.name} · {(file.size/1024/1024).toFixed(1)} MB · listo para enviar</span><button type="button" className="dr-x" aria-label="Quitar archivo" onClick={clearFile}><X size={15}/></button></div>}
            {fileError&&<div className="dr-err box" role="alert">{fileError}</div>}
          </div>
        </fieldset>

        {submitError&&<div className="message error" role="alert">{submitError}</div>}
        <button type="submit" className="dr-submit" disabled={submitting||!isConfigured}><Send size={17}/>{submitting?'Enviando...':'Enviar reporte anónimo'}</button>
      </form>
    </section>}

    {view==='confirm'&&<section className="panel dr-panel dr-confirm">
      <div className="dr-ok"><Check size={30}/></div>
      <span className="dr-badge">REGISTRO CONFIRMADO</span>
      <h3>¡Reporte registrado con éxito!</h3>
      <p>El equipo técnico de LABFIS recibirá tu notificación anónima. Guarda este identificador para dar seguimiento:</p>
      <div className="dr-pin"><small>CÓDIGO ÚNICO DE SEGUIMIENTO</small><strong data-testid="tracking-code">{createdCode}</strong>
        <button type="button" onClick={copyCode}>{copied?<><Check size={16}/> ¡Código copiado!</>:<><Copy size={16}/> Copiar código</>}</button></div>
      <p className="hint"><b>Importante:</b> al no requerir cuenta, este código es la única llave para consultar el avance.</p>
      {submitError&&<div className="message error" role="alert">{submitError}</div>}
      <div className="button-row">
        <button type="button" onClick={()=>{setCodeInput(createdCode);setView('track');lookup(createdCode)}}>Consultar estado ahora</button>
        <button type="button" className="secondary" onClick={()=>{setSubmitError('');setView('report')}}>Registrar otro daño</button>
      </div>
    </section>}

    {view==='track'&&<section className="panel dr-panel">
      <h3>Consultar estado de reporte</h3>
      <p className="muted">Ingresa el código recibido al momento de registrar el daño.</p>
      <form className="dr-search" onSubmit={e=>{e.preventDefault();lookup(codeInput)}}>
        <input value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="Ej. REP-2026-X8F2" aria-label="Código de seguimiento" autoCapitalize="characters"/>
        <button type="submit" disabled={trackLoading||!isConfigured}>{trackLoading?'Buscando...':'Consultar'}</button>
      </form>
      <div className="dr-chips"><small>Códigos de prueba:</small>
        {['REP-2026-X8F2','REP-2026-A104'].map(c=><button key={c} type="button" className="dr-chip" onClick={()=>{setCodeInput(c);lookup(c)}}>{c}</button>)}
        {createdCode&&<button type="button" className="dr-chip mine" onClick={()=>{setCodeInput(createdCode);lookup(createdCode)}}>{createdCode}</button>}
      </div>
      {trackError&&<div className="dr-notfound" role="alert"><b>Consulta sin resultados</b><span>{trackError}</span></div>}
      {!result&&!trackError&&<div className="dr-empty"><b>Sin búsqueda activa</b><span>Selecciona un código de prueba o escribe tu ticket para visualizar su estado.</span></div>}
      {result&&<div className="dr-result" data-testid="tracking-result">
        <div className="dr-result-top"><span className="dr-code">{result.tracking_code}</span><span className={'dr-status s'+info.step}>{info.label}</span></div>
        <div className="dr-grid">
          <div><small>Fecha</small><b>{formatDate(result.created_at)}</b></div>
          <div><small>Urgencia</small><b className={'urg-'+result.urgency}>{result.urgency}</b></div>
          <div className="wide"><small>Laboratorio y recurso</small><b>{result.lab_name} • {result.resource}</b></div>
        </div>
        <div className="dr-stepper" aria-label={'Progreso: '+info.label}>
          {['Registrado','En proceso','Atendido'].map((l,i)=><div key={l} className={'dr-step '+(info.step>i+1?'done':info.step===i+1?(info.step===3?'done':'now'):'')}><span>{info.step>i+1||(info.step===3&&i===2)?<Check size={14}/>:i+1}</span><small>{l}</small></div>)}
        </div>
        <div className="dr-note"><b>Nota técnica de LABFIS:</b><p>{result.tech_note}</p></div>
      </div>}
    </section>}
  </div>
}
