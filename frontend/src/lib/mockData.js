export const initialNodes = [
  { 
    id: '1', 
    type: 'input', 
    data: { label: 'Main Entry (index.js)' }, 
    position: { x: 250, y: 0 }, 
    style: { background: '#3b82f6', color: '#fff', borderRadius: '12px', padding: '10px', border: 'none', fontWeight: 'bold' } 
  },
  { 
    id: '2', 
    data: { label: 'Auth Controller' }, 
    position: { x: 100, y: 150 }, 
    style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' } 
  },
  { 
    id: '3', 
    data: { label: 'Database Schema' }, 
    position: { x: 400, y: 150 }, 
    style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px' } 
  },
];

export const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: '#3b82f6', strokeWidth: 2 } },
];