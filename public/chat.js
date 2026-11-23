'use strict';
const $ = id => document.getElementById(id);
let language = 'en', history = [], busy = false, capabilities = null, requestId = crypto.randomUUID();
const words = {
 en: {areaPhoto:"Photo of the area (optional)",areaPhotoHelp:"JPG, PNG, or WebP, up to 10 MB. In this test, the photo stays on your device.",areaPhotoInvalid:"Choose a JPG, PNG, or WebP image up to 10 MB.",testComplete:"Test complete",testNothingSent:"This test did not send or save your request or photo.",testLocal:"This ZIP is on our local service list. The team would verify the address before offering consultation times.",testOutside:"This ZIP needs a manual service-area review. Projects outside Portland–Vancouver can be reviewed as Signature Projects. The form does not offer a consultation time.",testPhotoReady:"Photo selected for this test.",formMissing:"Check the highlighted fields, then try again.",chatTab:'Ask us anything',leadTab:'Plan My Catio',prices:'Explore prices',materials:'Materials & safety',projects:'Real projects',messageLabel:'Your question',send:'Send',aiNotice:"Responses may need the team's review. This chat does not book, charge or submit a project request.",formTitle:'Tell us about your catio',testLead:"Test Project Request",testMode:"Private test. The form checks your entries here. No request will be sent or saved.",testPassed:"Test complete. The form passed validation. Nothing was sent or saved.",formIntro:'Share a few details for a preliminary estimate. No appointment or payment is required.',name:'Name',city:'City',type:'Project type',choose:'Choose one',freestanding:'Freestanding catio',window:'Window catio',patio:'Covered patio conversion',other:'Something else / help me choose',width:'Approx. width (feet)',depth:'Approx. depth (feet)',budget:'Budget range',cats:'Number of cats',notes:'Anything else? (optional)',submitLead:'Send project request',footer:'Draft preview · No bookings or payments · Your details are only submitted when you explicitly send a project request.',welcome:"Hi! I'm The Catio Company Assistant. I can help with catio ideas, materials and preliminary prices. What do you have in mind for your cats?",thinking:'Thinking…',previewAccess:"Reload this private preview and check that you’re signed in to GitHub. Your message is still here.",previewOrigin:"The private chat rejected this connection (Catio 403). Your message is still here.",tryAgainSoon:"The chat has received too many requests. Wait a minute and try again. Your message is still here.",chatTimeout:"The chat took too long to respond. Try sending your message again.",unavailable:'We could not complete that request. Please try again or contact info@thecatiocompany.com.',notConnected:'Project submission is not connected in this preview. Your details will not be sent or saved. Please contact info@thecatiocompany.com.',connected:'With your consent, your contact and project details will be privately submitted to The Catio Company.',saved:'Thank you! Your project request was confirmed by the server. Reference: ',notSaved:'Your project request was not confirmed. Please contact info@thecatiocompany.com.',partial:'We could not confirm the complete project request. Some contact details may have been saved. Please contact info@thecatiocompany.com before trying again.',noProjects:'Tell me a project type or feature so I can find documented examples.',you:'You',assistant:'The Catio Company Assistant'},
 es: {areaPhoto:"Foto del área (opcional)",areaPhotoHelp:"JPG, PNG o WebP de hasta 10 MB. En esta prueba, la foto se queda en tu dispositivo.",areaPhotoInvalid:"Elige una imagen JPG, PNG o WebP de hasta 10 MB.",testComplete:"Prueba completa",testNothingSent:"Esta prueba no envió ni guardó tu solicitud ni tu foto.",testLocal:"Este código postal está en nuestra lista de servicio local. El equipo verificaría la dirección antes de ofrecer horarios de consulta.",testOutside:"Este código postal requiere revisión. Podemos revisar proyectos fuera de Portland–Vancouver como Signature Projects. El formulario no ofrece horarios de consulta.",testPhotoReady:"Foto seleccionada para esta prueba.",formMissing:"Revisa los campos marcados y vuelve a intentarlo.",chatTab:'Haz una pregunta',leadTab:'Planear mi catio',prices:'Ver precios',materials:'Materiales y seguridad',projects:'Proyectos reales',messageLabel:'Tu pregunta',send:'Enviar',aiNotice:'Las respuestas pueden requerir revisión del equipo. Este chat no reserva, cobra ni envía solicitudes de proyecto.',formTitle:'Cuéntanos sobre tu catio',testLead:"Probar solicitud de proyecto",testMode:"Prueba privada. El formulario revisa tus datos aquí. No se enviará ni guardará una solicitud.",testPassed:"Prueba completa. El formulario pasó la validación. No se envió ni guardó nada.",formIntro:'Comparte algunos detalles para un estimado preliminar. No requiere cita ni pago.',name:'Nombre',city:'Ciudad',type:'Tipo de proyecto',choose:'Elige una opción',freestanding:'Catio independiente',window:'Catio de ventana',patio:'Conversión de patio techado',other:'Otro / ayúdame a elegir',width:'Ancho aproximado (pies)',depth:'Profundidad aproximada (pies)',budget:'Rango de presupuesto',cats:'Número de gatos',notes:'¿Algo más? (opcional)',submitLead:'Enviar solicitud de proyecto',footer:'Vista previa de borrador · Sin reservas ni cobros · Tus datos solo se envían al enviar expresamente una solicitud de proyecto.',welcome:'¡Hola! Soy The Catio Company Assistant. Puedo ayudarte con ideas, materiales y precios preliminares. ¿Qué tienes en mente para tus gatos?',thinking:'Pensando…',previewAccess:"Recarga esta vista privada y comprueba que iniciaste sesión en GitHub. Tu mensaje sigue aquí.",previewOrigin:"El chat privado rechazó la conexión (Catio 403). Tu mensaje sigue aquí.",tryAgainSoon:"El chat recibió demasiadas solicitudes. Espera un minuto y vuelve a intentarlo. Tu mensaje sigue aquí.",chatTimeout:"El chat tardó demasiado en responder. Intenta enviar tu mensaje otra vez.",unavailable:'No pudimos completar la solicitud. Inténtalo de nuevo o escribe a info@thecatiocompany.com.',notConnected:'El envío de solicitudes no está conectado en esta vista previa. Tus datos no se enviarán ni guardarán. Escribe a info@thecatiocompany.com.',connected:'Con tu consentimiento, tus datos de contacto y del proyecto se enviarán de forma privada a The Catio Company.',saved:'¡Gracias! El servidor confirmó tu solicitud de proyecto. Referencia: ',notSaved:'Tu solicitud de proyecto no fue confirmada. Escribe a info@thecatiocompany.com.',partial:'No pudimos confirmar la solicitud completa. Es posible que algunos datos de contacto se hayan guardado. Escribe a info@thecatiocompany.com antes de volver a intentarlo.',noProjects:'Dime un tipo de proyecto o una característica para buscar ejemplos documentados.',you:'Tú',assistant:'The Catio Company Assistant'}
};
function tr(key) { return words[language][key] || key; }
function bubble(role, text) {
 const div = document.createElement('div');
 div.className = 'bubble ' + role;
 const label = document.createElement('small');
 label.textContent = tr(role === 'user' ? 'you' : 'assistant');
 div.append(label);
 const approvedLinks = {
  "https://link.amazon/B013CJF63": {"en":"View on Amazon (paid link)","es":"Ver en Amazon (enlace pagado)"},
  "https://link.amazon/B0fisALWF": {"en":"View on Amazon (paid link)","es":"Ver en Amazon (enlace pagado)"},
  "https://link.amazon/A0hvt4hFC": {"en":"View on Amazon (paid link)","es":"Ver en Amazon (enlace pagado)"},
  "https://link.amazon/B0bgv88LL": {"en":"View on Amazon (paid link)","es":"Ver en Amazon (enlace pagado)"},
  'https://www.thecatiocompany.com/custom-catios-1/luxury-custom-catio-in-ridgefield-washington-designed-and-built-by-the-catio-company': {
   en: 'See the Ridgefield catio project',
   es: 'Ver el proyecto de Ridgefield'
  },
  'https://www.thecatiocompany.com/diy-catio-plans': {
   en: 'Browse all DIY catio plans',
   es: 'Ver todos los planos DIY'
  }
 };
 const parts = role === 'assistant' ? text.split(/(https:\/\/[^\s<>()\[\]]*[a-zA-Z0-9/])/g) : [text];
 for (const part of parts) {
  const label = role === 'assistant' && Object.hasOwn(approvedLinks, part) ? approvedLinks[part][language] : null;
  if (!label) {
   div.append(document.createTextNode(part));
   continue;
  }
  const link = document.createElement('a');
  link.href = part;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  div.append(link);
 }
 $('messages').append(div);
 $('messages').scrollTop = $('messages').scrollHeight;
}
function status(id,text,error=false) { $(id).textContent=text; $(id).className='status'+(error?' error':''); }
let photoPreviewUrl = '';
let testResult = null;
function renderTestResult() {
 $('leadResult').hidden = testResult === null;
 if (!testResult) return;
 $('leadResultRouting').textContent = tr(testResult.local ? 'testLocal' : 'testOutside');
 $('leadResultPhoto').textContent = testResult.photo ? tr('testPhotoReady') : '';
}
$('leadPhoto').addEventListener('change', () => {
 if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
 photoPreviewUrl = '';
 const file = $('leadPhoto').files[0];
 const image = $('leadPhotoPreview');
 image.removeAttribute('src');
 image.hidden = true;
 const valid = !file || (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 10_000_000);
 $('leadPhoto').setCustomValidity(valid ? '' : tr('areaPhotoInvalid'));
 status('leadPhotoStatus', valid ? '' : tr('areaPhotoInvalid'), !valid);
 if (file && valid) {
  photoPreviewUrl = URL.createObjectURL(file);
  image.src = photoPreviewUrl;
  image.hidden = false;
 }
});
$('leadForm').addEventListener('input', () => {
 testResult = null;
 renderTestResult();
 status('leadStatus', '');
});
$('leadForm').addEventListener('invalid', () => {
 status('leadStatus', tr('formMissing'), true);
}, true);
function applyLanguage() {
 document.documentElement.lang = language;
 document.querySelectorAll('[data-i]').forEach(el => el.textContent = tr(el.dataset.i));
 const live = capabilities?.leadsEnabled === true;
 $('leadConsentRow').hidden = !live;
 $('leadPhotoRow').hidden = live;
 $('leadForm').elements.namedItem('budgetRange').required = live;
 renderTestResult();
 $('contactConsent').required = live;
 $('contactConsentText').textContent = capabilities?.consentText?.[language] || '';
 $('leadAvailability').textContent = tr(live ? 'connected' : 'testMode');
 $('submitLead').textContent = tr(live ? 'submitLead' : 'testLead');
 if (!history.length) { $('messages').replaceChildren(); bubble('assistant',tr('welcome')); }
}
$('language').addEventListener('change',()=>{language=$('language').value;applyLanguage();});
function tab(lead) { $('leadPanel').hidden=!lead; $('chatPanel').hidden=lead; $('chatTab').setAttribute('aria-pressed',String(!lead)); $('leadTab').setAttribute('aria-pressed',String(lead)); }
$('chatTab').onclick=()=>tab(false); $('leadTab').onclick=()=>tab(true);
async function api(path, body) {
 const response = await fetch(path, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(35000)
 });
 const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
 if (!response.ok || !data) {
  const error = new Error(data?.error || 'REQUEST_FAILED');
  error.status = response.status;
  error.gatewayResponse = !data;
  error.data = data;
  throw error;
 }
 return data;
}
async function send(message) {
 if (busy || !message.trim()) return;
 busy = true;
 $('send').disabled = true;
 const draft = $('message').value;
 try {
  status('chatStatus', tr('thinking'));
  const data = await api('/api/chat', {message, history});
  if (typeof data.reply !== 'string') throw new Error('INVALID_REPLY');
  bubble('user', message);
  bubble('assistant', data.reply);
  history.push({role: 'user', content: message}, {role: 'assistant', content: data.reply});
  history = history.slice(-12);
  if ($('message').value === draft && draft === message) $('message').value = '';
  status('chatStatus', '');
 } catch (error) {
  if (!$('message').value) $('message').value = message;
  console.warn('Chat request failed:', error.status ?? error.name, error.message);
  const hint = error.data?.code === 'PREVIEW_ORIGIN_REJECTED' ? 'previewOrigin'
   : error.gatewayResponse && (error.status === 401 || error.status === 403 || error.status === 200) ? 'previewAccess'
   : error.status === 429 ? 'tryAgainSoon'
   : error.name === 'TimeoutError' ? 'chatTimeout'
   : 'unavailable';
  status('chatStatus', tr(hint), true);
 } finally {
  busy = false;
  $('send').disabled = false;
 }
}
$('chatForm').onsubmit=e=>{e.preventDefault();send($('message').value);};
$('leadForm').onsubmit=async e=>{e.preventDefault();if(!capabilities?.leadsEnabled){
 const zip = new FormData(e.target).get('zipCode');
 testResult = {local: capabilities?.previewConsultationZips?.includes(zip) === true, photo: Boolean(photoPreviewUrl)};
 status('leadStatus', '');
 renderTestResult();
 $('leadResult').focus();
 return;
}const payload=Object.fromEntries(new FormData(e.target));Object.assign(payload,{contactConsent:$('contactConsent').checked,consentVersion:capabilities.consentVersion,language,requestId});$('submitLead').disabled=true;try{const data=await api('/api/leads',payload);if(data.saved!==true||data.crmSynced!==true)throw Error('UNCONFIRMED');status('leadStatus',tr('saved')+data.receiptId);e.target.reset();requestId=crypto.randomUUID();$('submitLead').disabled=false;}catch(error){status('leadStatus',tr(error.data?.partial?'partial':'notSaved'),true);if(!error.data?.partial)$('submitLead').disabled=false;}};
applyLanguage();
fetch('/api/capabilities').then(response => {
 if (!response.ok) throw new Error('Capabilities unavailable');
 return response.json();
}).then(data => {
 capabilities = data;
}).catch(() => {
 capabilities = null;
}).finally(() => {
 applyLanguage();
 $('submitLead').disabled = false;
});
