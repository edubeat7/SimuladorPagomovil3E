import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft, CheckCircle2, ChevronRight, CircleHelp, Copy, Eye,
  EyeOff, Home, Landmark, LockKeyhole, LogOut, Phone, QrCode,
  ReceiptText, ScanLine, Send, ShieldCheck, Sparkles, UserRound, WalletCards,
  UserPlus, X,
} from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const PRACTICE_PASSWORD = "Asobanca123$";
const STARTING_BALANCE = 22664.34;
const banks = [
  "0102 · Banco de Venezuela", "0156 · 100% Banco", "0172 · Bancamiga Banco Universal, C.A.",
  "0114 · Bancaribe", "0171 · Banco Activo", "0128 · Banco Caroní", "0163 · Banco del Tesoro",
  "0175 · Banco Digital de los Trabajadores, Banco Universal", "0115 · Banco Exterior",
  "0151 · Banco Fondo Común", "0105 · Banco Mercantil", "0191 · Banco Nacional de Crédito",
  "0138 · Banco Plaza", "0137 · Banco Sofitasa", "0104 · Banco Venezolano de Crédito",
  "0168 · Bancrecer", "0134 · Banesco", "0177 · BANFANB", "0146 · Bangente", "0174 · Banplus",
  "0108 · BBVA Provincial", "0157 · DelSur Banco Universal", "0601 · Instituto Municipal de Crédito Popular",
  "0178 · N58 Banco Digital Banco Microfinanciero S.A.", "0169 · R4 Banco Microfinanciero C.A.",
];
const initialForm = { document: "V-", id: "", bank: "", phone: "", amount: "", concept: "" };
const practiceNames = [
  "Elena Rodríguez", "Carlos Martínez", "Luisa Fernández", "José Pérez", "Ana Morales",
  "Diego Herrera", "Carmen Silva", "Bodega La Esquina", "Teresa Rojas", "Manuel Díaz",
  "Julia Castro", "Pedro Ramírez", "Marta Salas", "Ricardo Gómez", "Sofía Acosta",
  "Andrés León", "Patricia Vargas", "Héctor Molina", "Beatriz Suárez", "Miguel Torres",
  "Rosa González", "Daniela Méndez", "Gabriel Núñez", "Farmacia Buen Vivir", "Claudia Paredes",
];
const practicePeople = banks.map((bank, index) => {
  const name = practiceNames[index];
  const initials = name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const prefix = ["0412", "0414", "0424", "0416", "0426"][index % 5];
  return {
    name,
    initials,
    document: index === 7 || index === 23 ? "J-" : "V-",
    id: index === 7 ? "412345678" : index === 23 ? "417654321" : String(12345678 + index * 39761),
    bank,
    phone: index === 0 ? "04121234567" : `${prefix}${String(1234567 + index * 9137).slice(-7)}`,
    ...(index === 7 || index === 23 ? { type: "Comercio" } : {}),
  };
});

const money = (value) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2 }).format(value);
const randomPracticeBalance = () => Number((20000 + Math.random() * (999999 - 20000)).toFixed(2));

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [screen, setScreen] = useState("home");
  const [form, setForm] = useState(initialForm);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [transactions, setTransactions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [modal, setModal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [people, setPeople] = useState(practicePeople);

  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const amount = Number(form.amount.replace(",", ".")) || 0;
  const selectedPerson = people.find((person) => person.document === form.document && person.id === form.id && person.bank === form.bank && person.phone === form.phone);
  const validPayment = Boolean(selectedPerson) && amount > 0 && amount <= balance;

  function enterBank(event) {
    event.preventDefault();
    if (loginPassword === PRACTICE_PASSWORD) {
      setLoggedIn(true);
      setLoginError("");
      setBalance(randomPracticeBalance());
      setTransactions([]);
    } else setLoginError("La clave no coincide. Revisa la clave de práctica indicada.");
  }

  function confirmPayment(event) {
    event.preventDefault();
    if (paymentPassword !== PRACTICE_PASSWORD) return;
    const createdReceipt = {
      ...form,
      amount,
      date: new Intl.DateTimeFormat("es-VE", { dateStyle: "long", timeStyle: "short" }).format(new Date()),
      reference: `PM${Date.now().toString().slice(-8)}`,
    };
    setReceipt(createdReceipt);
    setTransactions((current) => [createdReceipt, ...current]);
    setBalance((current) => current - amount);
    setModal("success");
    setPaymentPassword("");
  }

  function newPayment(person) {
    const hasPracticeData = person && typeof person === "object" && "id" in person && "bank" in person;
    setForm(hasPracticeData ? { ...initialForm, ...person, concept: "" } : initialForm);
    setReceipt(null);
    setScreen("payment");
  }

  function addPracticePerson(person) {
    setPeople((current) => [...current, { ...person, initials: person.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() }]);
    setModal(null);
  }

  if (!loggedIn) return <Login password={loginPassword} setPassword={setLoginPassword} error={loginError} submit={enterBank} />;

  return (
    <main className="app-shell">
      <SafetyBanner />
      <header className="topbar">
        {screen !== "home" && <button className="icon-button" onClick={() => setScreen("home")} aria-label="Volver"><ArrowLeft /></button>}
        <div className="brand"><Landmark /> <span>Pago Móvil <b>Práctica</b></span></div>
        <button className="icon-button" onClick={() => setLoggedIn(false)} aria-label="Cerrar sesión"><LogOut /></button>
      </header>

      {screen === "home" && <HomeScreen balance={balance} transactions={transactions} people={people} newPayment={newPayment} addPerson={() => setModal("add-person")} />}
      {screen === "payment" && <PaymentForm form={form} update={update} amount={amount} balance={balance} validPayment={validPayment} recipient={selectedPerson} next={() => setScreen("confirm")} openScanner={() => setModal("scanner")} />}
      {screen === "confirm" && <ConfirmScreen form={form} recipient={selectedPerson} amount={amount} pay={() => setModal("password")} />}
      {screen === "receipt" && <ReceiptScreen receipt={receipt} newPayment={newPayment} home={() => setScreen("home")} />}

      {modal === "password" && <PasswordModal password={paymentPassword} setPassword={setPaymentPassword} visible={showPassword} toggle={() => setShowPassword(!showPassword)} close={() => setModal(null)} submit={confirmPayment} />}
      {modal === "scanner" && <Scanner close={() => setModal(null)} complete={(data) => { setForm((old) => ({ ...old, ...data })); setModal(null); }} />}
      {modal === "add-person" && <AddPersonModal close={() => setModal(null)} submit={addPracticePerson} />}
      {modal === "success" && <SuccessModal continue={() => { setModal(null); setScreen("receipt"); }} />}
    </main>
  );
}

function SafetyBanner() {
  return <div className="safety-banner"><ShieldCheck size={19} /><span><strong>SIMULADOR EDUCATIVO:</strong> aquí no se mueve dinero real. Practica con tranquilidad.</span></div>;
}

function Login({ password, setPassword, error, submit }) {
  return <main className="login-page"><SafetyBanner /><section className="login-card">
    <div className="login-logo"><Landmark size={42} /></div><p className="eyebrow">BIENVENIDA/O</p><h1>Practica tu Pago Móvil</h1>
    <p className="intro">Un espacio seguro, diseñado para que puedas aprender paso a paso.</p>
    <div className="practice-key"><LockKeyhole /><div><strong>Clave de práctica</strong><span>{PRACTICE_PASSWORD}</span></div></div>
    <form onSubmit={submit}><label>Ingresa la clave para entrar al banco
      <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Escribe la clave de práctica" />
    </label>{error && <p className="error">{error}</p>}<button className="primary-button" type="submit">Entrar al simulador <ChevronRight /></button></form>
    <p className="support"><CircleHelp size={18} /> Si necesitas ayuda, pide apoyo a un familiar o acompañante.</p>
  </section></main>;
}

function HomeScreen({ balance, transactions, people, newPayment, addPerson }) {
  return <section className="page"><div className="greeting"><p>Hola, María</p><h1>¿Qué deseas practicar hoy?</h1></div>
    <section className="balance-card"><div><span>Saldo de práctica</span><strong>{money(balance)}</strong><small>Generado para esta sesión</small></div><WalletCards size={40} /></section>
    <button className="action-card" onClick={() => newPayment()}><span className="action-icon"><Send /></span><span><strong>Hacer un Pago Móvil</strong><small>Envía dinero de práctica a otra persona</small></span><ChevronRight /></button>
    <section className="practice-people"><div className="section-heading"><div><h2>Personas para practicar</h2><p>Elige una persona y sus datos se completarán.</p></div><button className="add-person-button" onClick={addPerson}><UserPlus /> Añadir</button></div>
      <div className="people-list">{people.map((person) => <button className="person-card" onClick={() => newPayment(person)} key={`${person.document}${person.id}`}><span className="avatar">{person.initials}</span><span><strong>{person.name} {person.type && <em>{person.type}</em>}</strong><small>{person.document}{person.id} · {person.phone}</small><small>{person.bank}</small></span><ChevronRight /></button>)}</div>
    </section>
    <section className="history"><h2>Prácticas recientes</h2>{transactions.length ? transactions.map((item) => <article className="history-item" key={item.reference}><span><UserRound /></span><div><strong>{item.document}{item.id}</strong><small>{item.concept || "Pago móvil de práctica"}</small></div><b>- {money(item.amount)}</b></article>) : <div className="empty"><ReceiptText /><p>Aún no has hecho prácticas.<br />¡Tu primera operación aparecerá aquí!</p></div>}</section>
  </section>;
}

function PaymentForm({ form, update, amount, balance, validPayment, recipient, next, openScanner }) {
  return <section className="page form-page"><div className="page-title"><p>Paso 1 de 2</p><h1>Datos del destinatario</h1><span>Completa los datos con calma. Puedes revisar antes de enviar.</span></div>
    <button className="scan-button" onClick={openScanner}><QrCode /><span><strong>Escanear código QR</strong><small>Usa la cámara o carga una imagen</small></span><ChevronRight /></button>
    <div className="divider"><span>o ingresa los datos</span></div>
    <div className="form-grid"><label>Documento de identidad<div className="compound"><select value={form.document} onChange={(e) => update("document", e.target.value)}><option>V-</option><option>E-</option><option>J-</option></select><input inputMode="numeric" value={form.id} onChange={(e) => update("id", e.target.value.replace(/\D/g, ""))} placeholder="Ej. 12345678" /></div></label>
      <label>Banco destino<select value={form.bank} onChange={(e) => update("bank", e.target.value)}><option value="">Selecciona el banco</option>{banks.map((bank) => <option key={bank}>{bank}</option>)}</select></label>
      <label>Teléfono móvil<div className="input-icon"><Phone /><input inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="0412 1234567" /></div></label>
      <label>Monto a enviar (Bs.)<input inputMode="decimal" value={form.amount} onChange={(e) => update("amount", e.target.value.replace(/[^\d,.]/g, ""))} placeholder="0,00" /><small className={amount > balance ? "error" : ""}>Disponible para practicar: {money(balance)}</small></label>
      <label>Concepto <span className="optional">(opcional)</span><input value={form.concept} onChange={(e) => update("concept", e.target.value)} placeholder="Ej. Regalo para mi nieto" /></label>
    </div>
    {recipient ? <div className="recipient-found"><CheckCircle2 /><span>Datos verificados: enviarás a <strong>{recipient.name}</strong>.</span></div> : <div className="recipient-not-found"><CircleHelp /><span>Ingresa los datos de una persona de práctica o añádela desde el inicio.</span></div>}
    <button className="primary-button wide" disabled={!validPayment} onClick={next}>Revisar operación <ChevronRight /></button>
  </section>;
}

function ConfirmScreen({ form, recipient, amount, pay }) {
  return <section className="page confirm-page"><div className="page-title"><p>Paso 2 de 2</p><h1>Revisa tu operación</h1><span>Verifica que todos los datos estén correctos antes de continuar.</span></div>
    <div className="confirmation-card"><div className="amount"><span>Vas a enviar</span><strong>{money(amount)}</strong></div><Detail label="Para" value={recipient?.name || `${form.document}${form.id}`} /><Detail label="Documento" value={`${form.document}${form.id}`} /><Detail label="Banco" value={form.bank} /><Detail label="Teléfono" value={form.phone} />{form.concept && <Detail label="Concepto" value={form.concept} />}</div>
    <div className="tip"><Sparkles /><p><strong>Consejo:</strong> si el nombre, teléfono o monto no son correctos, regresa y corrige antes de enviar.</p></div>
    <button className="primary-button wide" onClick={pay}><LockKeyhole /> Confirmar y pagar</button>
  </section>;
}
function Detail({ label, value }) { return <div className="detail"><span>{label}</span><strong>{value}</strong></div>; }

function PasswordModal({ password, setPassword, visible, toggle, close, submit }) {
  return <Modal><div className="modal-icon"><LockKeyhole /></div><h2>Confirma con tu clave</h2><p>Ingresa tu clave para autorizar esta operación de práctica.</p>
    <form onSubmit={submit}><label>Clave<div className="password-input"><input autoFocus type={visible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu clave" /><button type="button" onClick={toggle}>{visible ? <EyeOff /> : <Eye />}</button></div></label>{password && password !== PRACTICE_PASSWORD && <p className="error">La clave no coincide.</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button className="primary-button" disabled={password !== PRACTICE_PASSWORD}>Confirmar</button></div></form></Modal>;
}

function AddPersonModal({ close, submit }) {
  const [person, setPerson] = useState({ name: "", document: "V-", id: "", bank: "", phone: "" });
  const updatePerson = (field, value) => setPerson((current) => ({ ...current, [field]: value }));
  const valid = person.name.trim().length >= 3 && person.id.length >= 6 && person.bank && /^04\d{9}$/.test(person.phone);
  return <Modal><div className="modal-header"><div><div className="modal-icon"><UserPlus /></div><h2>Añadir persona de práctica</h2><p>Sus datos quedarán disponibles para practicar transferencias.</p></div><button className="icon-button" onClick={close}><X /></button></div>
    <form className="add-person-form" onSubmit={(event) => { event.preventDefault(); if (valid) submit(person); }}><label>Nombre y apellido<input autoFocus value={person.name} onChange={(e) => updatePerson("name", e.target.value)} placeholder="Ej. Ana Martínez" /></label>
      <label>Documento<div className="compound"><select value={person.document} onChange={(e) => updatePerson("document", e.target.value)}><option>V-</option><option>E-</option><option>J-</option></select><input inputMode="numeric" value={person.id} onChange={(e) => updatePerson("id", e.target.value.replace(/\D/g, ""))} placeholder="Ej. 12345678" /></div></label>
      <label>Banco<select value={person.bank} onChange={(e) => updatePerson("bank", e.target.value)}><option value="">Selecciona el banco</option>{banks.map((bank) => <option key={bank}>{bank}</option>)}</select></label>
      <label>Teléfono<input inputMode="numeric" value={person.phone} onChange={(e) => updatePerson("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="0412 1234567" /></label>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button className="primary-button" disabled={!valid}>Guardar persona</button></div>
    </form></Modal>;
}

function Scanner({ close, complete }) {
  const qrData = `V-12345678|${banks[0]}|04121234567`;
  const [qrImage, setQrImage] = useState("");
  const [status, setStatus] = useState("Abriendo cámara de práctica...");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrData, { width: 360, margin: 2, color: { dark: "#25131d", light: "#ffffff" } }).then((image) => active && setQrImage(image));
    const startScanning = setTimeout(() => active && setStatus("Escaneando código QR..."), 700);
    const finishScanning = setTimeout(() => {
      if (!active) return;
      setStatus("¡Código leído! Cargando los datos de Elena Rodríguez...");
      setTimeout(() => active && complete({ document: "V-", id: "12345678", bank: banks[0], phone: "04121234567", amount: "", concept: "Práctica con QR" }), 900);
    }, 3000);
    return () => { active = false; clearTimeout(startScanning); clearTimeout(finishScanning); };
  }, []);
  return <Modal><div className="modal-header"><div><h2>Escanear código QR</h2><p>Simulación de cámara para practicar con seguridad.</p></div><button className="icon-button" onClick={close}><X /></button></div><div className="scanner-simulation"><div className="scanner-frame">{qrImage && <img src={qrImage} alt="Código QR de práctica para Elena Rodríguez" />}<span className="scan-line" /></div><div className="scanner-status"><ScanLine /><strong>{status}</strong></div></div><div className="qr-person"><span className="avatar">ER</span><div><strong>Elena Rodríguez</strong><small>V-12345678 · 04121234567</small></div></div><small className="qr-help">La cámara es una simulación: los datos se cargarán automáticamente al terminar el escaneo.</small></Modal>;
}
function SuccessModal({ continue: proceed }) { return <Modal><div className="success"><CheckCircle2 /><p className="eyebrow">¡OPERACIÓN COMPLETADA!</p><h2>¡Felicitaciones!</h2><p>Has realizado tu Pago Móvil de práctica correctamente. Cada intento te ayuda a sentirte más segura/o.</p><button className="primary-button wide" onClick={proceed}>Ver comprobante <ReceiptText /></button></div></Modal>; }
function Modal({ children }) { return <div className="modal-backdrop"><section className="modal">{children}</section></div>; }

function ReceiptScreen({ receipt, newPayment, home }) {
  if (!receipt) return null;
  return <section className="page receipt-page"><div className="receipt-success"><CheckCircle2 /><h1>Pago Móvil completado</h1><p>Esta fue una operación de práctica.</p></div><div className="receipt-card"><p className="eyebrow">COMPROBANTE DE PRÁCTICA</p><strong className="receipt-amount">{money(receipt.amount)}</strong><Detail label="Destinatario" value={`${receipt.document}${receipt.id}`} /><Detail label="Banco destino" value={receipt.bank} /><Detail label="Teléfono" value={receipt.phone} /><Detail label="Fecha" value={receipt.date} /><Detail label="N° de operación" value={receipt.reference} /><button className="copy-button" onClick={() => navigator.clipboard?.writeText(receipt.reference)}><Copy /> Copiar número de operación</button></div><button className="primary-button wide" onClick={() => newPayment()}>Hacer otra práctica <Send /></button><button className="text-button" onClick={home}><Home /> Ir al inicio</button></section>;
}

createRoot(document.getElementById("root")).render(<App />);
