// Referencias al DOM
const workspace = document.getElementById('workspace');
const addNodeBtn = document.getElementById('add-node');
const exportJsonBtn = document.getElementById('export-json');
const importJsonInput = document.getElementById('import-json');
const connectionsSvg = document.getElementById('connections');

// Estado Global
let nodes = [];
let connections = [];
let isConnecting = false;
let startNode = null;
let currentLine = null;  // Línea en construcción

// Crear un nodo al hacer clic en "Agregar Nodo"
addNodeBtn.addEventListener('click', () => {
  const nodeId = `Node${nodes.length}`;
  const node = createNode(nodeId, 100, 100); // Coordenadas iniciales
  nodes.push({ id: nodeId, element: node, x: 100, y: 100 });
  workspace.appendChild(node);
});

// Crear un nodo
function createNode(id, x, y) {
  const node = document.createElement('div');
  node.className = 'node';
  node.textContent = id;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;

  // Hacer el nodo arrastrable
  node.addEventListener('mousedown', (e) => startDrag(e, node));

  // Permitir conexiones con doble clic
  node.addEventListener('dblclick', () => toggleConnection(node));

  return node;
}

// Mover nodos con arrastrar y soltar
function startDrag(event, node) {
  const offsetX = event.clientX - node.offsetLeft;
  const offsetY = event.clientY - node.offsetTop;

  function drag(e) {
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    updateNodePosition(node, x, y);
    if (currentLine) {
      // Actualizar la línea de conexión mientras arrastras
      updateLine(e.clientX, e.clientY);
    }
  }

  function stopDrag() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}

// Actualizar posición del nodo en el estado global
function updateNodePosition(node, x, y) {
  const nodeId = nodes.find((n) => n.element === node).id;
  const nodeData = nodes.find((n) => n.id === nodeId);
  nodeData.x = x;
  nodeData.y = y;
  renderConnections();
}

// Alternar estado de conexión
function toggleConnection(node) {
  const nodeId = nodes.find((n) => n.element === node).id;

  if (isConnecting) {
    const connection = { from: startNode, to: nodeId };
    connections.push(connection);
    renderConnections();
    isConnecting = false;
    startNode = null;
    // Eliminar línea en construcción
    if (currentLine) {
      currentLine.remove();
      currentLine = null;
    }
  } else {
    isConnecting = true;
    startNode = nodeId;
    // Crear una línea de conexión en proceso
    currentLine = createLine(node, startNode);
    workspace.appendChild(currentLine);
  }
}

// Crear una línea en construcción
function createLine(node, startNode) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const fromNode = nodes.find((n) => n.id === startNode);
  line.setAttribute('x1', fromNode.x + 60); // Centro del nodo
  line.setAttribute('y1', fromNode.y + 20); // Centro del nodo
  line.setAttribute('x2', fromNode.x + 60); // Empezar desde el nodo de inicio
  line.setAttribute('y2', fromNode.y + 20);
  line.setAttribute('stroke', '#ff5733');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '4'); // Línea discontinua mientras arrastras
  return line;
}

// Actualizar la línea mientras se arrastra
function updateLine(mouseX, mouseY) {
  const fromNode = nodes.find((n) => n.id === startNode);
  const offsetX = 60;
  const offsetY = 20;
  currentLine.setAttribute('x2', mouseX - workspace.offsetLeft - offsetX);
  currentLine.setAttribute('y2', mouseY - workspace.offsetTop - offsetY);
}

// Dibujar conexiones entre nodos
function renderConnections() {
  connectionsSvg.innerHTML = ''; // Limpiar conexiones previas

  connections.forEach(({ from, to }) => {
    const fromNode = nodes.find((n) => n.id === from);
    const toNode = nodes.find((n) => n.id === to);

    if (fromNode && toNode) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x + 60); // Centro del nodo
      line.setAttribute('y1', fromNode.y + 20); // Centro del nodo
      line.setAttribute('x2', toNode.x + 60); // Centro del nodo
      line.setAttribute('y2', toNode.y + 20); // Centro del nodo
      line.setAttribute('stroke', '#fff');
      line.setAttribute('stroke-width', '2');
      connectionsSvg.appendChild(line);
    }
  });
}

// Exportar a JSON
exportJsonBtn.addEventListener('click', () => {
  const jsonData = {
    nodes: nodes.map(({ id, x, y }) => ({ id, x, y })),
    connections,
  };
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nodes.json';
  link.click();
  URL.revokeObjectURL(url);
});

// Importar desde JSON
importJsonInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonData = JSON.parse(e.target.result);
      loadFromJson(jsonData);
    };
    reader.readAsText(file);
  }
});

// Cargar datos desde JSON
function loadFromJson(jsonData) {
  // Limpiar nodos y conexiones actuales
  nodes.forEach((n) => n.element.remove());
  nodes = [];
  connections = [];
  connectionsSvg.innerHTML = '';

  // Crear nodos
  jsonData.nodes.forEach(({ id, x, y }) => {
    const node = createNode(id, x, y);
    nodes.push({ id, element: node, x, y });
    workspace.appendChild(node);
  });

  // Crear conexiones
  connections = jsonData.connections || [];
  renderConnections();
}
