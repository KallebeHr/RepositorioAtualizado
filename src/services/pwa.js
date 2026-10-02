window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();window.repertorioInstallPrompt=event})
if('serviceWorker' in navigator && import.meta.env.PROD)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))
try{document.documentElement.classList.toggle('data-economy',localStorage.getItem('repertorio:economy')==='true');document.documentElement.classList.toggle('reduced-effects',localStorage.getItem('repertorio:effects')==='false')}catch{}
