import './App.css'
import LineChartComponent from './components/LineChart'
import PasswordGate from './components/PasswordGate'
import Header from './components/Header';

function App() {
  return (
    <PasswordGate>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <LineChartComponent />
        </main>
      </div>
    </PasswordGate>
  )
}

export default App
