'use strict';
const $ = id => document.getElementById(id);
let language = 'en', history = [], busy = false;
const words = {
 "en": {
  "messageLabel": "Your question",
  "send": "Send",
  "aiNotice": "Responses may need the team's review. This chat does not book, charge or submit a project request.",
  "welcome": "Hi! I'm The Catio Company Assistant. I can help with catio ideas, materials and preliminary prices. What do you have in mind for your cats?",
  "thinking": "Thinking…",
  "previewAccess": "Reload this private preview and check that you’re signed in to GitHub. Your message is still here.",
  "previewOrigin": "The private chat rejected this connection (Catio 403). Your message is still here.",
  "tryAgainSoon": "The chat has received too many requests. Wait a minute and try again. Your message is still here.",
  "chatTimeout": "The chat took too long to respond. Try sending your message again.",
  "unavailable": "We could not complete that request. Please try again or contact info@thecatiocompany.com.",
  "you": "You",
  "assistant": "The Catio Company Assistant",
  "contactForm": "Request an estimate",
  "emailDirect": "Email us directly",
  "footer": "Draft preview · Request an estimate through Contact Us."
 },
 "es": {
  "messageLabel": "Tu pregunta",
  "send": "Enviar",
  "aiNotice": "Las respuestas pueden requerir revisión del equipo. Este chat no reserva, cobra ni envía solicitudes de proyecto.",
  "welcome": "¡Hola! Soy The Catio Company Assistant. Puedo ayudarte con ideas, materiales y precios preliminares. ¿Qué tienes en mente para tus gatos?",
  "thinking": "Pensando…",
  "previewAccess": "Recarga esta vista privada y comprueba que iniciaste sesión en GitHub. Tu mensaje sigue aquí.",
  "previewOrigin": "El chat privado rechazó la conexión (Catio 403). Tu mensaje sigue aquí.",
  "tryAgainSoon": "El chat recibió demasiadas solicitudes. Espera un minuto y vuelve a intentarlo. Tu mensaje sigue aquí.",
  "chatTimeout": "El chat tardó demasiado en responder. Intenta enviar tu mensaje otra vez.",
  "unavailable": "No pudimos completar la solicitud. Inténtalo de nuevo o escribe a info@thecatiocompany.com.",
  "you": "Tú",
  "assistant": "The Catio Company Assistant",
  "contactForm": "Solicitar un estimado",
  "emailDirect": "Escríbenos directamente",
  "footer": "Vista privada · Solicita un estimado en Contact Us."
 }
};
function tr(key) { return words[language][key] || key; }
function bubble(role, text) {
 const div = document.createElement('div');
 div.className = 'bubble ' + role;
 const label = document.createElement('small');
 label.textContent = tr(role === 'user' ? 'you' : 'assistant');
 div.append(label);
 const approvedLinks = {
  'https://www.thecatiocompany.com/contact-us': {en: 'Request an estimate', es: 'Solicitar un estimado'},
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
function applyLanguage() {
 document.documentElement.lang = language;
 document.querySelectorAll('[data-i]').forEach(el => el.textContent = tr(el.dataset.i));
 if (!history.length) { $('messages').replaceChildren(); bubble('assistant',tr('welcome')); }
}
$('language').addEventListener('change',()=>{language=$('language').value;applyLanguage();});
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
applyLanguage();
