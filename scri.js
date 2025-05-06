setTimeout(() => {
    document.getElementById("startup").style.display = "none";
    document.getElementById("panel").style.display = "flex";
  }, 2000);
  
  let port, writer, reader;
  const textDecoder = new TextDecoderStream();
  let buffer = "";
  
  async function connect() {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      writer = port.writable.getWriter();
      port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      readLoop();
      alert("Arduino conectado");
    } catch (e) {
      alert("Error al conectar: " + e);
    }
  }
  
  async function sendCommand(cmd) {
    if (!writer) return alert("Conecta primero");
    const data = new TextEncoder().encode(cmd + "\n");
    await writer.write(data);
  }
  
  async function readLoop() {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        if (buffer.includes("\n")) {
          const lines = buffer.split("\n");
          buffer = lines.pop(); // conservar lo incompleto
          lines.forEach(line => processSerialData(line.trim()));
        }
      }
    }
  }
  
  function processSerialData(data) {
    console.log("Datos recibidos:", data);
  
    const values = data.split(",");
    values.forEach(item => {
      const [key, val] = item.split(":");
      if (key && val) {
        const id = key.trim().toLowerCase();
        const el = document.getElementById(id);
        if (el) el.textContent = val.trim();
  
        // Puerta animada
        if (id === "puerta") {
          const doorImg = document.getElementById("door-image");
          const doorText = document.getElementById("door-status");
          if (doorImg && doorText) {
            if (val.trim().toUpperCase() === "ABIERTA") {
              doorImg.src = "https://img.icons8.com/ios-filled/250/door-opened.png";
              doorImg.style.transform = "rotateY(0deg)";
              doorText.innerText = "Estado: Abierta";
            } else {
              doorImg.src = "https://img.icons8.com/ios-filled/250/door-closed.png";
              doorImg.style.transform = "rotateY(180deg)";
              doorText.innerText = "Estado: Cerrada";
            }
          }
        }
  
        // Llanta animada
        if (id === "llanta") {
          const tyre = document.getElementById("tyre-status");
          const tyreText = document.getElementById("tyre-text");
          if (tyre && tyreText) {
            const cleanVal = val.trim().toUpperCase();
            if (cleanVal === "OK") {
              tyre.style.borderColor = "lime";
              tyreText.innerText = "Presión: Normal";
            } else {
              tyre.style.borderColor = "red";
              tyreText.innerText = "Presión: Baja";
            }
          }
        }
  
        // Radar de distancia
        if (id === "distancia") {
          const d = parseInt(val);
          const circle = document.getElementById("proximity-circle");
          const text = document.getElementById("proximity-text");
  
          if (circle && !isNaN(d)) {
            let r = Math.max(10, 150 - d * 5);
            circle.style.transition = "r 0.3s ease, fill 0.3s ease";
            circle.setAttribute("r", r);
  
            if (d > 20) circle.setAttribute("fill", "#00ff66");
            else if (d > 10) circle.setAttribute("fill", "#ffcc00");
            else circle.setAttribute("fill", "#ff0033");
  
            text.innerText = `Distancia: ${d} cm`;
          }
        }
  
        // Barra de batería
        if (id === "bateria") {
          const b = parseInt(val);
          const bar = document.getElementById("battery-bar");
          const bText = document.getElementById("battery-text");
          if (bar && !isNaN(b)) {
            bar.style.width = b + "%";
            if (b > 60) bar.style.background = "lime";
            else if (b > 30) bar.style.background = "yellow";
            else bar.style.background = "red";
            bText.innerText = `Carga: ${b}%`;
          }
        }
  
        // Velocidad con anillo dinámico
        if (id === "velocidad") {
          const v = parseInt(val);
          const display = document.getElementById("velocidad");
          const arc = document.getElementById("speed-ring");
          if (!isNaN(v)) {
            display.innerText = v;
            let max = 120;
            let perc = Math.min(v / max, 1);
            let dashoffset = 502 - (502 * perc);
            arc.style.strokeDashoffset = dashoffset;
            arc.setAttribute("stroke", v > 80 ? "#ff0044" : v > 40 ? "#ffee00" : "#00ffee");
          }
        }
      }
    });
  }
  
  function showSection(section) {
    document.getElementById("section-" + section).classList.add("active");
  }
  
  function closeSections() {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  }