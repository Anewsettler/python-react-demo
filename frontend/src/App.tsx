import { useState, useEffect } from 'react';
import './App.css';
import TaskList from './components/TaskList';

interface Client {
  id: string;
  name: string;
}

function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch clients:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading clients...</div>;
  }

  return (
    <div className="App">
      <header>
        <h1>Task Management Demo</h1>
        <p>FastAPI + React + TypeScript</p>
      </header>
      
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
          <label htmlFor="client-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Select Client:
          </label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minWidth: '250px'
            }}
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClientId && <TaskList clientId={selectedClientId} />}
      </main>
    </div>
  );
}

export default App;
